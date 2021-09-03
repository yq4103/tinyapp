//Helper function to generate a random string for short url.
const generateRandomString = () => {
  return Math.random().toString(36).substr(2, 6);
};

//Helper function that checks if a shortURL is in the urlDatabase.
const getUserUrl = (userID, urlDatabase) => {
  const userURL = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === userID) {
      userURL[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURL;
};

// Help function that returns the user obj containing all the info if email is found, otherwise returns false.
const findUserByEmail = (email, users) => {
  for (let user_Id in users) {
    if (users[user_Id].email === email) {
      return users[user_Id]; // return the user object
    }
  }
  return false;
};

module.exports = { getUserUrl, findUserByEmail, generateRandomString };
