async function replaceUSDWithETH() {
    // load price from coingecko
    const data = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
    ).then((response) => response.json());
    const etherPrice = data.ethereum.usd;

    // replace simple dollar amounts
    const simpleDollarRegex = /\${1}(\d+(,\d{3})*(\.[0-9]*)?)/g;
    document.body.innerHTML = document.body.innerHTML.replace(
        simpleDollarRegex,
        (match, rawDollarAmount) => {
            const dollarAmount = +rawDollarAmount.replace(/\,/g, "");
            const ethAmount = dollarAmount / etherPrice;
            return `${ethAmount.toLocaleString("en-US", {
                maximumFractionDigits: 4,
            })} ETH`;
        }
    );

    // replace cases where the dollar sign, whole price, and fraction price are in different spans
    const threeSpanRegex =
        /<span (.*?)>\$<\/span><span (.*?)>(\d+(,\d{3})*)<span (.*?)>\.<\/span><\/span><span (.*?)>([0-9]*)<\/span>/g;
    document.body.innerHTML = document.body.innerHTML.replace(
        threeSpanRegex,
        (
            match,
            attrs1,
            attrs2,
            rawWholeDollarAmount,
            _,
            attrs3,
            attrs4,
            rawFractionalDollarAmount
        ) => {
            const wholeDollarAmount = +rawWholeDollarAmount.replace(/\,/g, "");
            const fractionalDollarAmount = +`0.${rawFractionalDollarAmount}`;
            const dollarAmount = wholeDollarAmount + fractionalDollarAmount;
            const ethAmount = dollarAmount / etherPrice;
            const wholeEthAmount = Math.floor(ethAmount);
            const fractionalEthAmount = ethAmount - wholeEthAmount;
            return `<span ${attrs1}>ETH</span><span ${attrs2}>${wholeEthAmount.toLocaleString(
                "en-US",
                {
                    maximumFractionDigits: 0,
                }
            )}<span ${attrs3}>.</span></span><span ${attrs4}>${fractionalEthAmount
                .toLocaleString("en-US", {
                    maximumFractionDigits: 4,
                })
                .substr(2)}</span>`;
        }
    );

    // replace cases where the dollar sign is in a separate span
    const separateSpanRegex =
        /<span (.*?)>\$<\/span>\s*<span (.*?)>(\d+(,\d{3})*(\.[0-9]*)?)<\/span>/g;
    document.body.innerHTML = document.body.innerHTML.replace(
        separateSpanRegex,
        (match, attrs1, attrs2, rawDollarAmount) => {
            const dollarAmount = +rawDollarAmount.replace(/\,/g, "");
            const ethAmount = dollarAmount / etherPrice;
            return `<span ${attrs1}>ETH</span><span ${attrs2}>${ethAmount.toLocaleString(
                "en-US",
                {
                    maximumFractionDigits: 4,
                }
            )}</span>`;
        }
    );
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status == "complete" && tab.active) {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            function: replaceUSDWithETH,
        });
    }
});
