# 🚀 LeetCode Rating Predictor Chrome Extension

A Chrome Extension that predicts **LeetCode contest rating changes directly on the ranking page**.
It fetches contest participant data and user ratings using **LeetCode APIs** and dynamically injects rating delta badges into the contest ranking table.

---

## ✨ Features

* 📊 Predicts rating change for users on the contest ranking page
* ⚡ Uses **LeetCode GraphQL API** to fetch user ratings
* 🌐 Fetches **contest participant count** using LeetCode contest API
* 🎯 Shows **rating delta badges (+ / -)** beside ranks
* 🔄 Automatically updates predictions when ranking table re-renders
* 🧠 Uses an **Elo-based approximation formula** for rating prediction
* 🖥️ Works directly on **LeetCode Weekly / Biweekly contest ranking pages**

---

## 🛠️ Tech Stack

* JavaScript (Vanilla JS)
* Chrome Extension (Manifest V3)
* DOM Manipulation
* MutationObserver
* Fetch API
* GraphQL

---

## 📂 Project Structure

```
lc-rating-predictor/
│
├── manifest.json      # Chrome extension configuration
├── content.js         # Main logic for fetching data & injecting UI
├── icon.png           # Extension icon
└── README.md          # Project documentation
```

---

## ⚙️ Installation (Local Setup)

1. Download or clone this repository

```
git clone https://github.com/your-username/lc-rating-predictor.git
```

2. Open Chrome and go to

```
chrome://extensions/
```

3. Enable **Developer Mode** (top-right)

4. Click **Load Unpacked**

5. Select the `lc-rating-predictor` folder

6. Open any LeetCode contest ranking page

Example:

```
https://leetcode.com/contest/weekly-contest-XXX/ranking/
```

You will see **rating delta predictions injected beside ranks.**

---

## 📈 Rating Prediction Logic

The extension estimates rating change using:

* Current user rating (GraphQL API)
* Contest rank
* Total participants
* Performance rating approximation

Formula (simplified):

```
performance_rating = 1500 + 400 * log10((participants - rank) / rank)

delta = (performance_rating - current_rating) * K
```

Where **K factor ≈ 0.2** for approximation.

---

## 📸 Preview

*Add screenshots here showing rating delta badges on ranking page.*

---

## 🚧 Future Improvements

* Predict rating change **only for logged-in user**
* Add **popup UI dashboard**
* Improve rating prediction accuracy
* Add **live prediction during contest**
* Publish on **Chrome Web Store**
* Cache API responses for performance

---

## 👨‍💻 Author

**Rajesh Kumar**
Computer Science Student

* LeetCode: https://leetcode.com/Rajesh_0041
* GitHub: https://github.com/your-username

---

## ⭐ Support

If you like this project, please **star the repository** ⭐
Contributions and suggestions are welcome!
