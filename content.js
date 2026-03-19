console.log("LeetCode Rating Predictor Loaded 🚀");

// Fetch the user's current rating from LeetCode GraphQL
async function fetchUserRating(username) {
    try {
        const query = `
            query getContestRankingData($username: String!) {
                userContestRanking(username: $username) {
                    rating
                }
            }
        `;
        const response = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: { username }
            })
        });
        const data = await response.json();
        return data.data?.userContestRanking?.rating || 1500;
    } catch (e) {
        console.error("Error fetching rating for", username, e);
        return 1500;
    }
}

// Fetch the approximate total participants for the contest
async function fetchTotalParticipants(contestSlug) {
    try {
        const response = await fetch(`https://leetcode.com/contest/api/info/${contestSlug}/`);
        const data = await response.json();
        return data?.user_num || 25000;
    } catch (e) {
        console.error("Error fetching contest info", e);
        return 25000; // default fallback
    }
}

// Approximate Elo rating delta calculation
function estimateRatingChange(currentRating, rank, totalParticipants) {
    currentRating = currentRating || 1500;
    let r = Math.max(1, Math.min(rank, totalParticipants - 1));
    // Estimate performance rating for the rank
    let perfRating = 1500 + 400 * Math.log10((totalParticipants - r) / r);
    // Delta with K factor
    let delta = (perfRating - currentRating) * 0.2;
    return Math.round(delta);
}

// Core prediction injection logic
async function injectPredictions() {
    // Get contest slug from URL
    const urlParts = window.location.pathname.split('/');
    const contestSlug = urlParts[urlParts.indexOf('contest') + 1];

    if (!contestSlug) return;

    // Cache total participants locally for 1 request
    if (!window._lcTotalParticipants) {
        window._lcTotalParticipants = await fetchTotalParticipants(contestSlug);
    }
    const totalParticipants = window._lcTotalParticipants;

    // Get ALL rank cells on the page
    const rankCellsRaw = Array.from(document.querySelectorAll('div[class*="w-[94px]"], td:first-child'));

    // Build a clean map of valid rank cells and their vertical Y coordinates on the screen
    const rankMap = [];
    for (const cell of rankCellsRaw) {
        let rankStr = cell.innerText.replace(/,/g, '').trim();
        let rank = parseInt(rankStr, 10);
        if (!isNaN(rank) && rank > 0) {
            let rect = cell.getBoundingClientRect();
            // Only consider visible elements
            if (rect.height > 0) {
                // Get absolute Y position (including page scroll)
                rankMap.push({
                    y: rect.top + window.scrollY,
                    rank: rank,
                    cell: cell // Save the DOM element so we can inject into it!
                });
            }
        }
    }

    // Get ALL user links on the page
    const allUserLinks = Array.from(document.querySelectorAll('a[href^="/u/"]'));

    const validRows = [];

    for (const link of allUserLinks) {
        let rect = link.getBoundingClientRect();
        if (rect.height === 0) continue; // skip invisible

        let linkY = rect.top + window.scrollY;

        // Find the rank cell that sits on the exact same horizontal visual row (within 15 pixels)
        let matchingRankData = rankMap.find(rm => Math.abs(rm.y - linkY) < 15);

        if (matchingRankData) {
            let username = link.getAttribute('href').split('/')[2];
            validRows.push({
                link,
                rank: matchingRankData.rank,
                username,
                rankCell: matchingRankData.cell
            });
        }
    }

    // We might have grabbed both the Avatar link and the Text link for the same user row.
    // The `validRows` logic in the injection loop below natively handles skipping duplicates via `link.dataset.predicted`.

    if (validRows.length > 0 && !window._loggedPredictionStart) {
        console.log(`🚀 Injecting predictions for ${contestSlug} (Participants: ${totalParticipants})`);
        window._loggedPredictionStart = true;
    }

    // Process each paired user and rank
    for (const { link, rank, username, rankCell } of validRows) {
        // Use custom datasets on the link to prevent double injection
        // Check if rankCell already has the badge to prevent double injection per row
        if (link.dataset.predicted === "true" || rankCell.dataset.predicted === "true") continue;
        link.dataset.predicted = "true";
        rankCell.dataset.predicted = "true";

        // Fetch user data & calculate asynchronously without blocking the loop
        (async () => {
            const currentRating = await fetchUserRating(username);
            const delta = estimateRatingChange(currentRating, rank, totalParticipants);

            // Build Badge UI
            const deltaElem = document.createElement('span');
            deltaElem.style.marginLeft = '4px'; // Tucked closely to the username
            deltaElem.style.padding = '1px 6px'; // More compact padding
            deltaElem.style.borderRadius = '12px';
            deltaElem.style.fontWeight = '700';
            deltaElem.style.fontSize = '12px';

            if (delta > 0) {
                deltaElem.innerText = `+${delta}`;
                deltaElem.style.backgroundColor = 'rgba(44, 187, 93, 0.15)';
                deltaElem.style.color = 'rgb(44, 187, 93)';
            } else if (delta < 0) {
                deltaElem.innerText = `${delta}`;
                deltaElem.style.backgroundColor = 'rgba(239, 71, 67, 0.15)';
                deltaElem.style.color = 'rgb(239, 71, 67)';
            } else {
                deltaElem.innerText = '0';
                deltaElem.style.backgroundColor = 'rgba(128, 128, 128, 0.15)';
                deltaElem.style.color = 'gray';
            }

            // For ultimate compatibility with LeetCode's strict CSS Grid layouts,
            // we will not force the cell to expand its width (which crashes into the username).
            // Instead, we float the badge cleanly on the right edge of the Rank cell itself!

            // 1. Make the rank cell a relative anchor point
            rankCell.style.position = 'relative';
            rankCell.style.overflow = 'visible'; // Let the badge bleed out if needed

            // 2. Float the badge perfectly within the 94px width of the rank cell
            deltaElem.style.position = 'absolute';
            // Pin it to the right boundary of the rank cell (so there's a permanent gap between Rank and Username)
            deltaElem.style.right = '-5px'; // Flow 20 pixels perfectly into the gap before the username starts
            deltaElem.style.top = '50%';
            deltaElem.style.transform = 'translateY(-50%)';
            deltaElem.style.zIndex = '9999';

            rankCell.appendChild(deltaElem);
        })();
    }
}

// To handle React SPA navigation, observe DOM for changes
let observerTimeout = null;
const observer = new MutationObserver((mutations) => {
    if (observerTimeout) clearTimeout(observerTimeout);
    observerTimeout = setTimeout(() => {
        if (window.location.pathname.includes('/ranking')) {
            injectPredictions();
        }
    }, 1500); // Wait for the table to fully render
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial Check
setTimeout(() => {
    if (window.location.pathname.includes('/ranking')) {
        injectPredictions();
    }
}, 3000);