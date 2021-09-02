const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser"); //The body-parser library will convert the request body from a Buffer into string that we can read.
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

//function to generate a random string for short url
function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

// return the user obj containing all the info if email is found
// otherwise return false
const findUserByEmail = (email, users) => {
  // return Object.keys(usersDb).find(key => usersDb[key].email === email)
  for (let user_id in users) {
    if (users[user_id].email === email) {
      return users[user_id]; // return the user object
    }
  }

  return false;
};

//when express server receives a POST request to /urls it responds with a redirection to /urls/:shortURL, where shortURL is the random string we generated
app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  const shortURL = generateRandomString();
  const url = req.body;
  urlDatabase[shortURL] = url.longURL;
  res.redirect(`/urls/${shortURL}`);
});

//Redirect any request to "/u/:shortURL" to its longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//Add a POST route that removes a URL resource
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls/");
});

//Add a POST route that updates a URL resource
//note: re.body is like this object { longURL: 'http://www.youtube.com' }
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

//Add an endpoint to handle a POST to /login in your Express server, set a cookie named username
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  //check if an email already exists
  const user = findUserByEmail(email, users);
  if (!user) {
    return res.status(403).send("Email address is not found.");
  }
  if (user.password !== password) {
    return res.status(403).send("Wrong credentials.");
  }
  res.cookie("user_id", user.id);
  res.redirect("/urls");
  //const templateVars = { username: req.cookies["username"] } is used to display the username, and it is passed it to new/index/show

});

//Add a GET /login endpoint that responds with the login.ejs
app.get('/login', (req, res) => {
  const templateVars = { username: users[req.cookies["user_id"]] };
  res.render('urls_login', templateVars);
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
  ///logout endpoint so that it clears the username cookie and redirects the user back to the /urls page

});

//app get for displaying registration page
app.get('/register', (req, res) => {
  const templateVars = { username: users[req.cookies["user_id"]] };
  res.render('urls_register', templateVars);
});

//Add a form with an email address and password field
//Note: req.body is like this object {email, password}
app.post("/register", (req, res) => {
  console.log("register")
  const email = req.body.email;
  const password = req.body.password;

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
  res.cookie("user_id", user_id);
  res.redirect("/urls");
});

//Update all endpoints that currently pass a username value to the templates to pass the entire user object to the template instead, in the four app.get?

//Update the _header partial to show the email value from the user object instead of the username: 

//render urls_new.ejs
app.get("/urls/new", (req, res) => {
  const templateVars = { username: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

//render urls_index.ejs
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});

//render urls.show.ejs
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
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