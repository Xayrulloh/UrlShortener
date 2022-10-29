const http = require("http");
const { fetch } = require("./database.js");
const fs = require("fs");
const regex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/;

const server = http.createServer(async(req, res) => {
  // create route
  if (req.url == "/create" && req.method == "POST") {
    // collecting data from body
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      body = JSON.parse(body);
      
      // checking body info
      if (checkUrl(body)) {
        // taking new short url
        let url = await urlGenerator();
        // writing to db
        try {
          await fetch(`insert into urls ( url, shorturl) values ($1, $2) returning *`, body, url);
        } catch (error) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end(JSON.stringify({ data: "null", status: 500, message: "Internal server error" }));
          return;
        }

        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(JSON.stringify({ data: {url: "http://localhost:3000/" + url, shortUrl: url}, status: 200, message: "OK" }));
      } else {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end(JSON.stringify({ data: "null", status: 400, message: "Bad Request" }));
      }
    });
  } 
  // create/custome route
  else if (req.url == "/create/custome" && req.method == "POST") {
    // collecting data
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async() => {
      body = JSON.parse(body);
      // checking url is not exist in db
      let checkingDb = await isExist(body["name"])

      // checking other info
      if (checkUrl(body["link"]) && body["name"] && Object.keys(body).length == 2 && !checkingDb) {

        // writing to db
        try {
          await fetch(`insert into urls ( url, shorturl) values ($1, $2) returning *`, body.link, body.name);
        } catch (error) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end(JSON.stringify({ data: "null", status: 500, message: "Internal server error" }));
          return;
        }

        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(JSON.stringify({ data: {url: "http://localhost:3000/" + body.name, shortUrl: body.name}, status: 200, message: "OK" }));
      } else {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end(JSON.stringify({ data: "null", status: 400, message: "Bad Request" }));
      }
    });
  } 
  // / route
  else if (req.method === "GET" && req.url == "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.write(fs.readFileSync("./index.html"));
    res.end();
  } 
  // localhost:3000/* route
  else if (req.method === "GET") {
    let url = req.url
    url = url.split('/')
    if (url.length != 2) {
      res.writeHead(302, {
        'Location': 'http://localhost:3000/'
      });
      res.end();
    } else if (url.length == 2 && url[1].length < 11) {
      url = url.join('')
      let checkingDb = await isExist(url)
      if (checkingDb) {
        res.writeHead(302, {
          'Location': checkingDb.url
        });
        res.end();
      } else {
        res.writeHead(302, {
          'Location': 'http://localhost:3000/'
        });
        res.end();
      } 
    }
  }
});
server.listen(3000, () => {
  console.log("The server is listening on port 3000");
});

function checkUrl(url) {
  return regex.test(url);
}

async function urlGenerator(url = "") {
  let chars = "abcdefhiklmnoqrstuvwxyz0123456789".split("");
  let result = "";
  for (let i = 0; i < 7; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  let data = await fetch(`select * from urls u where u.shorturl = $1`, result);
  if (data) {
    return urlGenerator(data);
  }
  return result;
}

async function isExist(url) {
  let data = await fetch(`select * from urls u where u.shorturl = $1`, url);
  return data
}