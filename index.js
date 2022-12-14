import Koa from "koa";
import logger from "koa-logger";
import { getCAWSInConstituency, getConstituencies, getConstituenciesInCounty, getCounties, getPollingCentersInCAW, getPollingStationsInCenter, getPrecinctsInCaw, getSitesInCAW } from "./Counties.js";
import Router from "@koa/router";
const router = new Router();

import bodyParser from "koa-bodyparser";
import fs from "fs";
import {  getCountyPrezForms, getPrezForms, updateNullPaths } from "./forms.js";

const app = new Koa();
app.use(bodyParser());

// middlewares

app.use(logger());



router.get('/', (ctx) => {
  ctx.body = 'Sina Maoni!';
});
router.get("/counties", async (ctx) => {
  const counties = await getCounties();
  ctx.body = counties;
});

router.get("/constituencies", async (ctx) => {
  // This route is faulty, you can only fetch constituencies for a county use the post method instead 
  const constituencies = await getConstituencies();
  ctx.body = constituencies;
});

router.post("/constituencies", async (ctx) => {
  // Sample body:
  // {
  //   "county": {
  //     "id": 1,
  // }
  console.log(ctx.request.body);
  const { county } = ctx.request.body;
  const constituencies = await getConstituenciesInCounty(county);

  ctx.body = constituencies;
});

router.post("/caws", async (ctx) => {
  // Sample body:
  // {
  //   "constituency": {
  //     "id": 1194,
  // }
  console.log(ctx.request.body);
  const  {constituency}  = ctx.request.body;
  const caws = await getCAWSInConstituency(constituency);
  ctx.body = caws;
});

router.post("/pcenters", async (ctx) => {
  // Sample body:
  // {
  //   "caw": {
  //     "id": 553,
  // }
  console.log(ctx.request.body);
  const  {caw}  = ctx.request.body;
  const pollingStations = await getPollingCentersInCAW(caw);
  ctx.body = pollingStations;
} );

router.post("/pstations", async (ctx) => {
  // Sample body:
  // {
  //   "center": {
  //     "id": 553,
  // }
  // This route requires the polling center data to work
  console.log(ctx.request.body);
  const  {center}  = ctx.request.body;
  const pollingStations = await getPollingStationsInCenter(center);
  ctx.body = pollingStations;
} );

router.post("/presidentialforms", async (ctx) => {
  // Sample body:
  // {}
  //  THIS ROUTE IS EXTREMELY SLOW IF THERE IS NO CACHING
  ctx.request.socket.setTimeout(5 * 60 * 1000);
  console.log(ctx.request.body);
  const forms = await getPresidentialForms(ctx.request.body);
  // const forms = await getForms(ctx.request.body);
  ctx.body = forms;
} );
router.post("/countyPresidentialforms", async (ctx) => {
  // Sample body:
//   {
//     "c": "7",
//     "cc": "0440000000000",
//     "n": "MIGORI",
//     "cacheOnly": true
// }
  // THIS ROUTE IS EXTREMELY SLOW IF THERE IS NO CACHING - 
  ctx.request.socket.setTimeout(5 * 60 * 1000);
  console.log(ctx.request.body);
  const forms = await getCountyPrezForms({county: ctx.request.body, cacheOnly: ctx.request.body.cacheOnly});
  // const forms = await getForms(ctx.request.body);
  ctx.body = forms;
} );

router.post("/updateNullPaths", async (ctx) => {
  ctx.request.socket.setTimeout(5 * 60 * 1000);
  console.log(ctx.request.body);
  const forms = await updateNullPaths({countyObj: ctx.request.body, direct: false});
  ctx.body = forms;
} );

// Route to read the stored counties and for the counties missing the constituency data, get the constituency data and store it.









router.post("/regionLookup", async (ctx) => {
  // Read from the regions file and return the region object for the given region id.
  console.log("regionLookup");
  const regions = await JSON.parse(fs.readFileSync("./regions.json", "utf8"));
  // console.log(regions);
  const region = regions.filter(region => region.c === `${ctx.request.body.id}`);
  console.log(region);
  ctx.body = region;
} );
router.post("/nameLookup", async (ctx) => {
  // Read from the regions file and return the region object for the given region id.
  console.log("nameLookup");
  const region = await nameLookup(ctx.request.body.id);
  console.log(region);
  ctx.body = region;
} );
const nameLookup = async (entry) => {
  const regions = await JSON.parse(fs.readFileSync("./regions.json", "utf8"));
  const regionObject = regions.find(region => region.c === `${entry}`);
  console.log("RegionObject:",regionObject);
  return regionObject;
}
router.post("/getPrezForms", async (ctx) => {
  // Sample body:
//   {
//     "cacheOnly": true
// }
  ctx.request.socket.setTimeout(50 * 60 * 1000);
  console.log("getPrezForms");
  const prezForms = await getPrezForms(ctx.request.body);
  console.log(prezForms);
  ctx.body = prezForms;
  
} );
router.post("/getSitesInCAW", async (ctx) => {
  console.log(ctx.request.body);
  const sites = await getSitesInCAW({id: ctx.request.body.id});
  console.log("getSitesInCAW");
  // const sites = await getSitesInCAW();
  console.log(sites);
  ctx.body = sites;
} );
router.post("/getPrecinctsInCaw", async (ctx) => {
  console.log(ctx.request.body);
  const sites = await getPrecinctsInCaw({id: ctx.request.body.id});
  console.log("getPrecinctsInCaw");
  // const sites = await getSitesInCAW();
  console.log(sites);
  ctx.body = sites;
  
} );
const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.use(router.routes());

app.listen(process.env.PORT || 3000);
