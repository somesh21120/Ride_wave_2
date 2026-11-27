const http = require('http');

function req(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: "localhost", port: 5000, path, method, headers: { "Content-Type": "application/json" } };
    if (token) opts.headers["Authorization"] = "Bearer " + token;
    const r = http.request(opts, (res) => { let d=""; res.on("data",c=>d+=c); res.on("end",()=>{ try{ resolve({s:res.statusCode,d:JSON.parse(d)}) }catch{ resolve({s:res.statusCode,t:d}) } }); });
    r.on("error", reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

(async () => {
  const ok = [];
  const fail = [];

  async function t(name, fn) {
    try { const r = await fn; if (r.s < 400) ok.push(name); else fail.push(name+" ("+r.s+": "+(r.d?.message||r.t||"")+")"); }
    catch(e) { fail.push(name+": "+e.message); }
  }

  await t("GET /", req("GET","/"));
  const p = await req("POST","/api/auth/login",null,{email:"passenger@test.com",password:"pass123"});
  const pt = p.d?.token;
  await t("POST /api/auth/login (passenger)", Promise.resolve(p));

  const d = await req("POST","/api/auth/login",null,{email:"driver@test.com",password:"drive123"});
  const dt = d.d?.token;
  await t("POST /api/auth/login (driver)", Promise.resolve(d));

  if (pt) {
    await t("GET /api/auth/profile", req("GET","/api/auth/profile",pt));
    await t("POST /api/rides/book (cash)", req("POST","/api/rides/book",pt,{pickupLocation:{address:"MG Road,Bangalore",lat:12.9716,lng:77.5946},dropoffLocation:{address:"Indiranagar,Bangalore",lat:12.9783,lng:77.6408},distance:5.2,rideType:"car",paymentMethod:"cash"}));
    await t("POST /api/rides/book (bike)", req("POST","/api/rides/book",pt,{pickupLocation:{address:"MG Road,Bangalore",lat:12.9716,lng:77.5946},dropoffLocation:{address:"Indiranagar,Bangalore",lat:12.9783,lng:77.6408},distance:3.1,rideType:"bike",paymentMethod:"cash"}));
    await t("GET /api/rides/my-rides", req("GET","/api/rides/my-rides",pt));

    // Razorpay order creation
    await t("POST /api/payment/create-order", req("POST","/api/payment/create-order",pt,{amount:178}));
  }

  if (dt) {
    await t("GET /api/rides/available", req("GET","/api/rides/available",dt));
    // Get the first available ride to accept
    const avail = await req("GET","/api/rides/available",dt);
    if (avail.d?.length > 0) {
      const rideId = avail.d[0]._id;
      await t("PUT /api/rides/:id/accept", req("PUT","/api/rides/"+rideId+"/accept",dt));
      await t("PUT /api/rides/:id/start", req("PUT","/api/rides/"+rideId+"/start",dt));
      await t("PUT /api/rides/:id/complete", req("PUT","/api/rides/"+rideId+"/complete",dt));
    }
    await t("GET /api/rides/driver-rides", req("GET","/api/rides/driver-rides",dt));
  }

  // Admin
  if (pt) {
    const aLogin = await req("POST","/api/auth/login",null,{email:"admin@ridewave.app",password:"Admin@123"});
    const at = aLogin.d?.token;
    if (at) {
      await t("POST /api/auth/login (admin)", Promise.resolve(aLogin));
      await t("GET /api/admin/stats", req("GET","/api/admin/stats",at));
      await t("GET /api/admin/users", req("GET","/api/admin/users",at));
      await t("GET /api/admin/rides", req("GET","/api/admin/rides",at));
    }
  }

  console.log("\n=== E2E TEST RESULTS ===");
  console.log("PASSED:", ok.length, "?");
  if (fail.length) { console.log("FAILED:", fail.length, "?"); fail.forEach(f => console.log("  - " + f)); }
  else console.log("ALL TESTS PASSED ???");
})();
