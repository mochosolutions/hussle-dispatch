import { useState } from "react";
function usePagination(data, itemsPerPage) {
  const [currentPage, setCurrentPage] = useState(1);
  const maxPage = Math.ceil(data.length / itemsPerPage);
  function currentData() {
    const begin = (currentPage - 1) * itemsPerPage;
    const end = begin + itemsPerPage;
    return data.slice(begin, end);
  }
  function next() {
    setCurrentPage((currentPage2) => Math.min(currentPage2 + 1, maxPage));
  }
  function prev() {
    setCurrentPage((currentPage2) => Math.max(currentPage2 - 1, 1));
  }
  function jump(page) {
    const pageNumber = Math.max(1, page);
    setCurrentPage(() => Math.min(pageNumber, maxPage));
  }
  return {
    next,
    prev,
    jump,
    currentData,
    currentPage,
    maxPage
  };
}
export {
  usePagination as default
};
//# sourceMappingURL=usePagination.js.map
