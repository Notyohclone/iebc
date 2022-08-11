
import fs from "fs";
import { getCAWSInConstituency, getConstituenciesInCounty, getCounties, getPollingCentersInCAW, getPollingStationsBySite, getPollingStationsInCenter, getPrecinctsInCaw, getSiteByCawIdAndPollingStationId, getSitesInCAW, getStationNamesBySite } from "./Counties.js";
const IEBC_COUNTY_URL =
  "https://forms.iebc.or.ke/assets/data/totalized_results/regions/0/";
const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const getPrezForms = async ({cacheOnly}) => {
  let forms = [];
  const counties = await getCounties();
  // console.log("Counties:",counties)
  for (let index = 0; index < counties.length; index++) {
    const county = counties[index];
    console.log(county);
    county.id = parseInt(county.c);
    // console.log(county);
    const constituenciesArr = await getCountyPrezForms({county: county, cacheOnly: cacheOnly});
    console.log(constituenciesArr);
    forms.push(constituenciesArr);

    }

  console.log("Forms:",forms)
  fs.writeFileSync(`prezForms.json`, JSON.stringify(forms))
  return forms;
}


const getCountyPrezForms = async ({county, cacheOnly}) => {
  // Returns an array of objects with the following structure:
  // {
  //   county: {
  //     id: <county id>,
  //     name: <county name>
  //   },
  //   constituencies: [
  //     {
  //       id: <constituency id>,
  //       name: <constituency name>,
  //       caws: [
  //         {  
  //           id: <caw id>,
  //           name: <caw name>,
  //           centers: [
  //             {
  //               id: <center id>,
  //               name: <center name>,
  //               pollingStations: [
  //                 {
  //                   id: <polling station id>,
  //                   name: <polling station name>,
  //                   form: <form object>
  //                 }
  //               ]
  //             }
  //           ]
  //         }
  //       ]
  //     }
  //   ]
  // }
  console.log("County:",county);
  // To speed up the process:
  // 1. Check if the county has been downloaded before
  // 2. If not, download the county
  // 3. If yes, check if the county has any polling stations whose path === null  (i.e. the form was unavaliable before) and now get the polling stations for the null paths
  // 4. Replace the null paths with the new paths
  // 5. Save the county
  // 6. Return the county
  county.id = parseInt(county.c);
  const newCounty = await checkIfCountyIsDownloaded(county);
  console.log("New County:",newCounty);
  if (newCounty) {
    // if the cacheOnly flag is set to true, return the county without running any other functions
    if (cacheOnly) {
      return newCounty;
    } 
    // if the cacheOnly flag is set to false run the updateNullPaths function on the county then return the county
    const updatedCounty = await updateNullPaths({countyArr:newCounty, direct: true, countyObj: county});
    console.log("Updated County:",updatedCounty);
    return updatedCounty;
  } else {
    
  let constituencies = await getConstituenciesInCounty(county);
  // console.log("Constituencies:",constituencies);
  constituencies = constituencies[0].forms[0].nl;
  let constituenciesArr = [];

  for (let index = 0; index < constituencies.length; index++) {
    const constituency = constituencies[index];
    constituency.id = parseInt(constituency.ec);
    // console.log(constituency);
    let constituencyName = await nameLookup(constituency.id);
    // console.log("Constituency Name:",constituencyName);
    let name = constituencyName.n;
    // console.log("Name:",name);
    const caws = await getCAWSInConstituencyRoutine(constituency);
    
    constituenciesArr.push(
      {
        constituencyId: constituency.id,
        constituencyName: name,
        caws: caws
      });
  }
  console.log("ConstituenciesArr:",constituenciesArr);
  let countyName = county.n;
  // Remove any / from the county name and replace it with _
  countyName = countyName.replace(/\//g, "_");
  fs.writeFileSync(`${countyName}.json`, JSON.stringify(constituenciesArr))
  return constituenciesArr;
}
}

const checkIfCountyIsDownloaded = async (county) => {
  // Returns true if the county has been downloaded before
  // Returns false if the county has not been downloaded before
  // const regions = await JSON.parse(fs.readFileSync("./regions.json", "utf8"));
  console.log("CountyFile:",`./${county.n}.json`);
  let countyName = county.n;
  // Remove any / from the county name and replace it with _
  countyName = countyName.replace(/\//g, "_");
  console.log("CountyName:",countyName);
  // Check if the county has been downloaded before  by checking if the county file exists
  if (fs.existsSync(`${countyName}.json`)) {
    // If the county file exists, return the parsed file
    const county = await JSON.parse(fs.readFileSync(`${countyName}.json`, "utf8"));
    return county;
  } else {
    // If the county file does not exist, return false
    return false;
  }
  // const countyFile = await JSON.parse(fs.readFileSync(`./${countyName}.json`, "utf8");
  // console.log("CountyFile:",countyFile);
  // if (Object.keys(countyFile).length > 0) {
  //   return await countyFile;
  // } else {
  //   return null;
  // }
}

const updateNullPaths = async ({countyArr, direct, countyObj}) => {
  // Returns true if the caw has any polling stations whose path === null
  // Returns false if the caw has no polling stations whose path === null
  // Loop through the constituencies in the county
  // Loop through the caws in the constituency
  // Loop through the centers in the caw
  // Loop through the polling stations in the center
  // If the polling station's path is null, rerun the getPollingStationsInCenter function for the polling station and update the path
  // If the polling station's path is not null, continue to the next polling station
  // console.log("direct:",direct);
  let newCounty;
  if (direct) {
     newCounty = countyArr;
  } else {
     newCounty = await checkIfCountyIsDownloaded(countyObj);
  }
  // let newCounty = await checkIfCountyIsDownloaded(county);
  // console.log("New County:",newCounty);
  if (newCounty) {
    // newCounty = JSON.parse(newCounty);
    for (let index = 0; index < newCounty.length; index++) {
      const constituency = newCounty[index];
      for (let index = 0; index < constituency.caws.length; index++) {
        const caw = constituency.caws[index];
        for (let index = 0; index < caw.centers.length; index++) {
          const center = caw.centers[index];
          for (let index = 0; index < center.pollingStations.length; index++) {
            const pollingStation = center.pollingStations[index];
            if (pollingStation.path === null) {
              const newPath = await updatePollingStationPath({
                pollingStation: pollingStation,
                center: center,
                caw: caw,
                constituency: constituency,
                county: countyObj,
              });
              
              // pollingStation.path = newPath;
              center.pollingStations[index] = newPath;
            }
          }
        }
      }
    }
    let countyName = countyObj.n;
    // console.log("countyName", countyName)
    // Remove any / from the county name and replace it with _
    countyName = countyName.replace(/\//g, "_");
    fs.writeFileSync(`${countyName}.json`, JSON.stringify(newCounty));
  } else {
    return {
      error: "County not downloaded"
    };
  }
  return newCounty;
};

const updatePollingStationPath = async ({pollingStation, center, caw, constituency, county}) => {
  // Returns the pollingStation object with the updated path
  // console.log("Polling Station:",pollingStation);
  // console.log("Center:",center);
  // console.log("Caw:",caw);
  // console.log("Constituency:",constituency);
  // console.log("County:",county);
  // First get the new polling station by the polling station id
  try {
    
  const newPollingStation = await getPollingStationById({
    id: pollingStation.id,
    center: center,
    caw: caw,
  }
  
  );
  console.log("New Polling Station:",newPollingStation);
  return newPollingStation;
  } catch (error) {
    console.log("Error:",error);
    return {
      error: error
    };
  }
    
  
}

const getPollingStationById = async ({id, center, caw, constituency, county}) => {
  // Returns the polling station object with the given id
  // console.log("stationNames:",stationNames);
  // console.log(stationNames);
  // console.log("id:",id);
  // console.log("center:",center);
  // console.log("caw:",caw);
  let pollingStationsInSite = [];
  let pollingStationSite = await getSiteByCawIdAndPollingStationId({cawId: caw.cawId, pollingStationId: id, centerId: center.centerId});
  let pollingStation = pollingStationSite;
  // console.log("Polling Station:",pollingStation);
  if (pollingStation.status) {
    // console.log("Polling Station:",pollingStation);
    throw new Error(pollingStation.message);
    return {
      error: pollingStation.message
    }
  }
  // console.log("Polling Station:",pollingStation);
    pollingStation.id = parseInt(pollingStation.ec);
    let stationName = center.centerName;
    // console.log("Station Name:",stationName);
    let name = stationName;
    // console.log("Name:",name);
    // console.log("pollingStation:",pollingStation);
    // console.log(pollingStation.forms[0].nl);
    // const form = await getFormsInPollingStationRoutine(pollingStation);
    pollingStationsInSite.push(
      {
        id: pollingStation.ec,
        name: name,
        form:  `https://forms.iebc.or.ke/${pollingStation.path}`,
        path: pollingStation.path,
        expected: pollingStation.exp,
        actual: pollingStation.ver
      });
  
  return pollingStationsInSite;
}



const nameLookup = async (entry) => {
  const regions = await JSON.parse(fs.readFileSync("./regions.json", "utf8"));
  const regionObject = regions.find((region) => region.c === `${entry}`);
  // console.log("RegionObject:",regionObject);
  // const regionObject = regions.find(region => region.c === `${entry.id}`);
  return regionObject;
}
const getCAWSInConstituencyRoutine = async (constituency) => {
  let cawsInConst = [];
  const cawsArr = await getCAWSInConstituency(constituency);
  // console.log("cawsArr:",cawsArr);
  // console.log(cawsArr);
  const caws = cawsArr[0].forms[0].nl;
  for (let index = 0; index < caws.length; index++) {
    const caw = caws[index];
    caw.id = parseInt(caw.ec);
    // console.log("caw:",caw);
    // console.log(caw);
    let cawName = await nameLookup(constituency.id);
    // console.log("cawName Name:",cawName);
    let name = cawName.n;
    // console.log("Name:",name);
    const precincts = await getPrecinctsInCaw({id: caw.c});
    const centers = await getSitesInCAWRoutine(caw, precincts);
    // console.log("Centers:",centers);
    // console.log(centers);
    cawsInConst.push(
      {
        cawId: caw.id,
        cawName: name,
        centers: centers
      });
  }
  // console.log("cawsInConst:",cawsInConst);
  return cawsInConst;
}

const getSitesInCAWRoutine = async (caw, precincts) => {
  let centersInCaw = [];
  const sites = await getSitesInCAW(caw);
  // console.log("Sites:",sites);
  console.log(sites);
  for (let index = 0; index < sites.length; index++) {
    const site = sites[index];
    site.id = parseInt(site.c);
    // console.log("site:",site);
    console.log(site);
    const stationNames = await getStationNamesBySite(site);
    // console.log("stationNames:",stationNames);
    const pollingStations = await getPollingStationsBySiteRoutine(site, stationNames);

    centersInCaw.push(
      {
        centerId: site.id,
        centerName: site.n,
        pollingStations: pollingStations
      });
  }
  // console.log("centersInCaw:",centersInCaw);
  return centersInCaw;
}

const getPollingStationsBySiteRoutine = async (center, stationNames) => {
  // console.log("stationNames:",stationNames);
  // console.log(stationNames);
  // console.log("center:",center);
  let pollingStationsInSite = [];
  let pollingStations = await getPollingStationsBySite(center);
  pollingStations = pollingStations[0].forms[0].nl;
  // console.log("Polling Stations:",pollingStations);
  // console.log(pollingStations);
  for (let index = 0; index < pollingStations.length; index++) {
    const pollingStation = pollingStations[index];
    pollingStation.id = parseInt(pollingStation.ec);
    let stationName = stationNames.find(station => station.c === pollingStation.id);
    // console.log("Station Name:",stationName);
    let name = stationName.n;
    // console.log("Name:",name);
    // console.log("pollingStation:",pollingStation);
    // console.log(pollingStation.forms[0].nl);
    // const form = await getFormsInPollingStationRoutine(pollingStation);
    pollingStationsInSite.push(
      {
        id: pollingStation.ec,
        name: name,
        form:  `https://forms.iebc.or.ke/${pollingStation.path}`,
        path: pollingStation.path,
        expected: pollingStation.exp,
        actual: pollingStation.ver
      });
  }
  return pollingStationsInSite;
}




export {  getPrezForms, getCountyPrezForms, updateNullPaths };


