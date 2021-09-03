const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser"); //The body-parser library will convert the request body from a Buffer into string that we can read.
//const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');


app.use(bodyParser.urlencoded({extended: true}));
//app.use(cookieParser());
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))


const bcrypt = require('bcryptjs');

//function to generate a random string for short url
function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
};

//modifying the structure of our urlDatabase and change all the CRUD operations of our app
//const urlDatabase = {
//  "b2xVn2": "http://www.lighthouselabs.ca",
//  "9sm5xK": "http://www.google.com"
//};

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

const { getUserUrl, findUserByEmail } = require("./helpers");

//when express server receives a POST request to /urls it responds with a redirection to /urls/:shortURL, where shortURL is the random string we generated
app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  const userID = req.session.user_id;
  //if userID is not in the user datebase, ask the user to login first
  if (!userID) {
    return res.status(403).send("Login first.");
  }
  urlDatabase[shortURL] = { longURL, userID };
  //urlDatabase[shortURL].userID = req.cookies["user_id"];
  //a none logged in user cannot add a new url with a POST request to /urls
  
  res.redirect(`/urls/${shortURL}`);
});


//render urls_index.ejs
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const urls = getUserUrl(userID, urlDatabase);
  const templateVars = { urls, user: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});


//Add an endpoint to handle a POST to /login in your Express server, set a cookie named username
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  //check if an email already exists
  const user = findUserByEmail(email, users);
  console.log("this is an object", user);
  if (!user) {
    return res.status(403).send("Email address is not found.");
  }
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Wrong credentials.");
  }
  req.session["user_id"] = user.id;
  res.redirect("/urls");
  //const templateVars = { username: req.cookies["username"] } is used to display the username, and it is passed it to new/index/show

});

//Add a GET /login endpoint that responds with the login.ejs
app.get('/login', (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render('urls_login', templateVars);
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
  ///logout endpoint so that it clears the username cookie and redirects the user back to the /urls page

});

//app get for displaying registration page
app.get('/register', (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render('urls_register', templateVars);
});

//Add a form with an email address and password field
//Note: req.body is like this object {email, password}
app.post("/register", (req, res) => {
  console.log("register")
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10);

  //check if an email already exists
  const userFound = findUserByEmail(email, users);

  if (userFound) {
    return res.status(400).send("User already exists.");
  }

  if (!email || !password) {
    return res.status(400).send("Please enter email/password.");
  }

  // generate a new user id
  const user_id = generateRandomString();
  // create a new user object
  const newUser = {
    id: user_id,
    email,
    password,
  };

  // Adding user info to users
  users[user_id] = newUser;
  console.log("this is a new user", newUser)
  req.session["user_id"] = user.id;
  res.redirect("/urls");
});

//render urls_new.ejs
app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    return res.redirect("/login");
  }
  const templateVars = { user: users[req.session.user_id] };
  res.render("urls_new", templateVars);
});

//Redirect any request to "/u/:shortURL" to its longURL
app.get("/u/:shortURL", (req, res) => {
  const urlObj = urlDatabase[req.params.shortURL];
  //if the short url is not valid
  if(!urlObj) {
    return res.status(403).send("Your short URL is not valid.");
  }
  res.redirect(urlObj.longURL);
});



//Add a POST route that updates a URL resource
//note: req.body is like this object { longURL: 'http://www.youtube.com' }
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL].longURL = longURL;
  res.redirect(`/urls/${shortURL}`);
});

//render urls.show.ejs
app.get("/urls/:shortURL", (req, res) => {
  const shortURL= req.params.shortURL;
  const userID = req.session.user_id;
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


//Add a POST route that removes a URL resource
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL= req.params.shortURL;
  const userID = req.session.user_id;
  //if not logged in, redirect to login page
  if (!userID) {
    return res.redirect("/login");
  }
  const urlObj = urlDatabase[shortURL];
  //only the owner of a shortURL can delete it
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