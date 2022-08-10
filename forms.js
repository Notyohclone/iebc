
import fs from "fs";
import { getCAWSInConstituency, getConstituenciesInCounty, getCounties, getPollingCentersInCAW, getPollingStationsBySite, getPollingStationsInCenter, getPrecinctsInCaw, getSitesInCAW, getStationNamesBySite } from "./Counties.js";
const IEBC_COUNTY_URL =
  "https://forms.iebc.or.ke/assets/data/totalized_results/regions/0/";
const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const getPrezForms = async () => {
  let forms = [];
  const counties = await getCounties();
  // console.log("Counties:",counties)
  for (let index = 0; index < counties.length; index++) {
    const county = counties[index];
    county.id = parseInt(county.c);
    // console.log(county);
    const constituenciesArr = await getCountyPrezForms(county);
    console.log(constituenciesArr);
    forms.push(constituenciesArr);

    }

  console.log("Forms:",forms)
  fs.writeFileSync(`prezForms.json`, JSON.stringify(forms))
  return forms;
}


const getCountyPrezForms = async (county) => {
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
  fs.writeFileSync(`${county.n}.json`, JSON.stringify(constituenciesArr))
  return constituenciesArr;
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
  // console.log(sites);
  for (let index = 0; index < sites.length; index++) {
    const site = sites[index];
    site.id = parseInt(site.c);
    // console.log(site);
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




export {  getForms, getPrezForms, getCountyPrezForms };


