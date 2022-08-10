// This exports an object with several functions.
// The functions are:
// getCounties: returns an array of counties objects fetched from the constant IEBC url with an overriden User-Agent header.
// getConstituencies: returns an array of constituencies objects fetched from the constant IEBC url with an overriden User-Agent header.
// getConstituenciesInCounty: returns an array of constituencies objects fetched from the constant IEBC url with an overriden User-Agent header.
// getWardsInConstituency: returns an array of wards objects fetched from the constant IEBC url with an overriden User-Agent header.
// getPollingStationsInCenter: returns an array of polling stations objects fetched from the constant IEBC url with an overriden User-Agent header.

// const fetch = require("node-fetch");
// const cheerio = require('cheerio');
import fetch from "node-fetch";
import fs from "fs";
import axios from "axios";

const IEBC_URL = "https://forms.iebc.or.ke/assets/data/regions.json";
const IEBC_COUNTY_URL =
  "https://forms.iebc.or.ke/assets/data/totalized_results/regions/0/";
const IEBC_CONSTITUENCY_URL =
  "https://forms.iebc.or.ke/assets/data/totalized_results/regions/1/";
const IEBC_CENTER_URL =
  "https://forms.iebc.or.ke/assets/data/totalized_results/sites/6/";

const IEBC_BASE_URL = "https://forms.iebc.or.ke/assets/data/totalized_results/";

const IEBC_SITES_URL = "https://forms.iebc.or.ke/assets/data/";

const getCounties = async () => {
  const response = await fetch(IEBC_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36",
    },
  });
  const allFields = await response.json();
  // console.log(allFields);
  // The counties are gotten by filtering the allFields array which is an array of objects. Each county object has a field called l which is equal 2, which means that it is a county.
  const counties = allFields.filter((field) => field.l === 2);
  // console.log(counties);
  // const counties = allFields.filter((field) => field.L === 2);
  // Save the JSON to a file for later use.
  // fs.writeFileSync("counties.json", JSON.stringify(counties));
  return counties;
};

const getConstituencies = async () => {
  const response = await fetch(IEBC_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36",
    },
  });
  const allFields = await response.json();
  // console.log(constituencies);
  // The constituencies are gotten by filtering the the allFields array which is an array of objects. Each county object has a field called l which is equal 3, which means that it is a county.
  const constituencies = allFields.filter((field) => field.l === 3);
  // Save the JSON to a file for later use.
  // fs.writeFileSync("constituencies.json", JSON.stringify(constituencies));
  return constituencies;
};

const getConstituenciesInCounty = async (county) => {
  const regions = await JSON.parse(fs.readFileSync("./regions.json", "utf8"));
  const region = regions.find((region) => region.c === `${county.id}`);
  // console.log(region);
  // If the region object is not found, return an error object.
  if (!region) {
    return {
      status: "error",
      message: "Region not found",
    };
  } else {
    let path = region.rf;
    // path is of the form regions/1/1001.json remove the .json
    path = path.substring(0, path.length - 5);
    // console.log(path);
    console.log(county);
    let url = `${IEBC_BASE_URL}${path}_F.json`;
    // console.log(url);
    // const response = await fetch(`${IEBC_COUNTY_URL}${county.id}_F.json`, {
    //   headers: {
    //     "User-Agent":
    //       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36",
    //   },
    // });
    // Send request with Axios instead of fetch with an overriden User-Agent header.
    // wrap the request in a try catch block to handle errors and return an error object if there is an error.
    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36",
        },
      });
      const constituencies = response.data;
      // console.log(constituencies);
      return constituencies;
    } catch (error) {
      console.log(error);
      return {
        status: "error",
        message: error.response.status,
      };
    }
  }
};

const getCAWSInConstituency = async (constituency) => {
  const regions = await JSON.parse(fs.readFileSync("./regions.json", "utf8"));
  const region = regions.find((region) => region.c === `${constituency.id}`);
  // console.log(region);
  // If the region object is not found, return an error object.
  if (!region) {
    return {
      status: "error",
      message: "Region not found",
    };
  } else {
    let path = region.rf;
    // path is of the form regions/1/1001.json remove the .json
    path = path.substring(0, path.length - 5);
    // console.log(path);
    // wrap the request in a try catch block to handle errors and return an error object if there is an error.
    try {
      const response = await axios.get(
        `${IEBC_BASE_URL}${path}_F.json`,

        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36",
          },
        }
      );
      // console.log(response);
      const caws = await response.data;
      // console.log(caws);
      // Save the JSON to a file for later use.
      // fs.writeFileSync(`${constituency.id}.json`, JSON.stringify(caws));
      return caws;
    } catch (error) {
      console.log(error);
      return {
        status: "error",
        message: error.response.status,
      };
    }
  }
};

const getPollingCentersInCAW = async (ward) => {
  // First check for the region object in the regions.json file. Use the rf field to get the url.
  const regions = await JSON.parse(fs.readFileSync("./regions.json", "utf8"));
  const region = regions.find((region) => region.c === `${ward.id}`);
  // console.log(region);
  // If the region object is not found, return an error object.
  if (!region) {
    return {
      status: "error",
      message: "Region not found",
    };
  } else {
    let path = region.rf;
    // path is of the form regions/1/1001.json remove the .json
    path = path.substring(0, path.length - 5);
    // console.log(path);

    try {
      const response = await axios.get(`${IEBC_BASE_URL}${path}_F.json`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36",
        },
      });
      // console.log(response);
      const pollingStations = await response.data;
      // console.log(pollingStations);
      // Save the JSON to a file for later use.
      // fs.writeFileSync(`${ward.id}.json`, JSON.stringify(pollingStations));
      return pollingStations;
    } catch (error) {
      console.log(error);
      return {
        status: "error",
        message: error.response.status,
      };
    }
  }
};

const getPollingStationsInCenter = async (ward, site) => {
 
    let path = region.rf;
    // path is of the form regions/1/1001.json remove the .json
    path = path.substring(0, path.length - 5);
    console.log(path);

    try {
      const response = await fetch(`${IEBC_BASE_URL}${path}_F.json`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36",
        },
      });
      const pollingStations = await response.json();
      // console.log(pollingStations);
      // Save the JSON to a file for later use.
      // fs.writeFileSync(`${ward.id}_PS.json`, JSON.stringify(pollingStations));
      return pollingStations;
    } catch (error) {
      console.log(error);
      return {
        status: "error",
        message: error.response.status,
      };
    }
  
};
const getPollingStationsBySite = async (site) => {
  let path = site.rf;
  // path is of the form sites/12/12472.json remove the .json
  path = path.substring(0, path.length - 5);
  try {
    const response = await fetch(`${IEBC_BASE_URL}${path}_F.json`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36",
      },
    });
    const pollingStations = await response.json();
    // console.log(pollingStations);
    // Save the JSON to a file for later use.
    // fs.writeFileSync(`${ward.id}_PS.json`, JSON.stringify(pollingStations));
    return pollingStations;
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      message: error.response.status,
    };
  }
};

const getSitesInCAW = async (ward) => {
  // First check for the region object in the regions.json file. Use the rf field to get the url.
  const regions = await JSON.parse(fs.readFileSync("./regions.json", "utf8"));
  const region = regions.find((region) => region.c === `${ward.id}`);
  // console.log(region);
  // If the region object is not found, return an error object.
  if (!region) {
    return {
      status: "error",
      message: "Region not found",
    };
  } else {
    let path = region.chp;
    // path is of the form sites/0/r829.json remove the .json
    path = path.substring(0, path.length - 5);
    // console.log(path);

    try {
      const response = await axios.get(`${IEBC_SITES_URL}${path}.json`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36",
        },
      });
      const sites = await response.data;
      // console.log(sites);
      // Save the JSON to a file for later use.
      // fs.writeFileSync(`${ward.id}_Sites.json`, JSON.stringify(sites));
      return sites;
    } catch (error) {
      console.log(error);
      return {
        status: "error",
        message: error.response.status,
      };
    }
  }
};

const getPrecinctsInCaw = async (caw) => {
  // First check for the region object in the regions.json file. Use the rf field to get the url.
  const regions = await JSON.parse(fs.readFileSync("./regions.json", "utf8"));
  const region = regions.find((region) => region.c === `${caw.id}`);
  // console.log(region);
  // If the region object is not found, return an error object.
  if (!region) {
    return {
      status: "error",
      message: "Region not found",
    };
  } else {
    let path = region.chp;
    // path is of the form sites/0/r829.json remove the .json
    path = path.substring(0, path.length - 5);
    // console.log(path);
  try {
    const response = await fetch(`${IEBC_SITES_URL}${path}.json`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36",
      },
    });
    const precincts = await response.json();
    // console.log(pollingStations);
    // Save the JSON to a file for later use.
    // fs.writeFileSync(`${ward.id}_PS.json`, JSON.stringify(pollingStations));
    return precincts;
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      message: error.response.status,
    };
  }
}
}
const getStationNamesBySite = async (site) => {
  // First check for the region object in the regions.json file. Use the rf field to get the url.

    let path = site.chp;
    // path is of the form sites/0/r829.json remove the .json
    path = path.substring(0, path.length - 5);
    // console.log(path);
  try {
    const response = await fetch(`${IEBC_SITES_URL}${path}.json`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36",
      },
    });
    const precincts = await response.json();
    // console.log(pollingStations);
    // Save the JSON to a file for later use.
    // fs.writeFileSync(`${ward.id}_PS.json`, JSON.stringify(pollingStations));
    return precincts;
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      message: error.response.status,
    };
  }

}


export {
  getCounties,
  getConstituencies,
  getConstituenciesInCounty,
  getCAWSInConstituency,
  getPollingCentersInCAW,
  getPollingStationsInCenter,
  getSitesInCAW,
  getPollingStationsBySite,
  getPrecinctsInCaw,
  getStationNamesBySite
};
