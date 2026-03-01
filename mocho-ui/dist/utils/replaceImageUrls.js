function replaceImageUrls(htmlContent, urlMapping) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const images = doc.querySelectorAll("img[data-placeholder-id]");
  const replacedIds = [];
  const missingIds = [];
  let replacedCount = 0;
  images.forEach((img) => {
    const placeholderId = img.getAttribute("data-placeholder-id");
    if (!placeholderId) {
      return;
    }
    const cdnUrl = urlMapping[placeholderId];
    if (cdnUrl) {
      img.setAttribute("src", cdnUrl);
      img.removeAttribute("data-placeholder-id");
      replacedIds.push(placeholderId);
      replacedCount++;
    } else {
      missingIds.push(placeholderId);
    }
  });
  const updatedContent = doc.body.innerHTML;
  return {
    content: updatedContent,
    replacedCount,
    replacedIds,
    missingIds
  };
}
export {
  replaceImageUrls
};
//# sourceMappingURL=replaceImageUrls.js.map
