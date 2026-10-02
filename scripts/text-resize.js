const h2hNameFitter = document.createElement("canvas").getContext("2d");
const minimumTextFontSize = 1;
const fitTextSelector = "p, td, .h2h-winloss > div";

function fitPageText() {
	document.querySelectorAll(fitTextSelector).forEach((element) => {
		const text = element.textContent.trim();
		if (!text) return;

		element.style.fontSize = "";
		if (element.matches("td") && element.children.length > 0) return;

		element.style.whiteSpace = "nowrap";
		element.style.minWidth = "0";
		element.style.maxWidth = element.matches(".h2h-winloss > div") ? "50px" : "100%";
		element.style.width = element.matches(".h2h-winloss > div") ? "50px" : "100%";
		element.style.boxSizing = "border-box";
		if (element.id === "vs") element.style.textAlign = "center";

		const availableWidth = element.clientWidth;
		const styles = getComputedStyle(element);
		const baseFontSize = parseFloat(styles.fontSize);

		if (!availableWidth || !baseFontSize) return;

		h2hNameFitter.font = `${styles.fontWeight} ${baseFontSize}px ${styles.fontFamily}`;
		const textWidth = h2hNameFitter.measureText(text).width;
		const letterSpacing = parseFloat(styles.letterSpacing) || 0;
		const fullTextWidth = textWidth + Math.max(0, text.length - 1) * letterSpacing;

		if (fullTextWidth > availableWidth) {
			const fittedSize = Math.max(minimumTextFontSize, baseFontSize * availableWidth / fullTextWidth);
			element.style.fontSize = `${fittedSize}px`;
		}
	});
}

fitPageText();
const textLayoutObserver = new ResizeObserver(fitPageText);
document.querySelectorAll(".panel, #table-list").forEach((container) => textLayoutObserver.observe(container));
window.addEventListener("resize", fitPageText);
new MutationObserver(fitPageText).observe(document.body, {
	characterData: true,
	childList: true,
	subtree: true,
});
