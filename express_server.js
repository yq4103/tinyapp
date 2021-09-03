const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { getUserUrl, findUserByEmail, generateRandomString } = require("./helpers");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "a1@a.com",
    password: bcrypt.hashSync("111", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "a2@a.com",
    password: bcrypt.hashSync("222", 10)
  }
};

//When express server receives a POST request to /urls it responds with a redirection to /urls/:shortURL, where shortURL is the random string we generated.
app.post("/urls", (req, res) => {
  const userID = req.session.user_Id;
  //if userID is not in the user datebase, ask the user to login first
  if (!userID) {
    return res.status(403).send("Login first.");
  }
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;

  urlDatabase[shortURL] = { longURL, userID };
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls", (req, res) => {
  const userID = req.session.user_Id;
  const urls = getUserUrl(userID, urlDatabase);
  const templateVars = { urls, user: users[req.session.user_Id] };
  res.render("urls_index", templateVars);
});

//Add an endpoint to handle a POST to /login in Express server, set a cookie.
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  //Check if an email or a password was entered.
  if (!req.body || !req.body.email) {
    return res.status(403).send("Enter email/password.");
  }
  //Check if an email already exists.
  const user = findUserByEmail(email, users);
  if (!user) {
    return res.status(403).send("Email address is not found.");
  }
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Wrong credentials.");
  }
  req.session.user_Id = user.id;
  res.redirect("/urls");
});

app.get('/login', (req, res) => {
  const templateVars = { user: users[req.session.user_Id] };
  res.render('urls_login', templateVars);
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//Add a form with an email address and password field.
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10);
  //Check if a user already exists.
  const userFound = findUserByEmail(email, users);
  if (userFound) {
    return res.status(400).send("User already exists.");
  }
  if (!email || !password) {
    return res.status(400).send("Please enter email/password.");
  }
  // Generate a new user id.
  const user_Id = generateRandomString();
  // Create a new user object.
  const newUser = {
    id: user_Id,
    email,
    password,
  };
  // Adding user info to users.
  users[user_Id] = newUser;
  req.session.user_Id = user_Id;
  res.redirect("/urls");
});

app.get('/register', (req, res) => {
  const templateVars = { user: users[req.session.user_Id] };
  res.render('urls_register', templateVars);
});

app.get("/urls/new", (req, res) => {
  const user_Id = req.session.user_Id;
  if (!user_Id) {
    return res.redirect("/login");
  }
  const templateVars = { user: users[req.session.user_Id] };
  res.render("urls_new", templateVars);
});

//Redirect any request to "/u/:shortURL" to its longURL.
app.get("/u/:shortURL", (req, res) => {
  const urlObj = urlDatabase[req.params.shortURL];
  //if the short url is not valid
  if (!urlObj) {
    return res.status(403).send("Your short URL is not valid.");
  }
  res.redirect(urlObj.longURL);
});

//Add a POST route that updates a URL resource.
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL].longURL = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.user_Id;
  if (!userID) {
    return res.redirect("/login");
  }
  const urlObj = urlDatabase[shortURL];
  if (!urlObj) {
    return res.status(403).send("You have an invalid short URL.");
  }
  if (userID !== urlObj.userID) {
    return res.status(403).send("You do not have permission to visit this page.");
  }
  const user = users[userID];
  const templateVars = { shortURL, longURL: urlObj.longURL, user };
  res.render("urls_show", templateVars);
});

//Add a POST route that removes a URL resource.
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.user_Id;
  //If not logged in, redirect to login page.
  if (!userID) {
    return res.redirect("/login");
  }
  const urlObj = urlDatabase[shortURL];
  //Only the owner of a shortURL can delete it.
  if (!urlObj) {
    return res.status(403).send("You have an invalid short URL.");
  }
  if (userID !== urlObj.userID) {
    return res.status(403).send("You do not have permission to visit this page.");
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls/");
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
});
 
app.get("/fetch", (req, res) => {
  res.send(`a = ${a}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
