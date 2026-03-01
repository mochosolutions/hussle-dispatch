import DOMPurify from "dompurify";

function createMarkup(dirty) {
  return { __html: DOMPurify.sanitize(dirty) };
}

export { createMarkup };