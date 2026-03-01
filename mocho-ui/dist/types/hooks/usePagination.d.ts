export default function usePagination(data: any, itemsPerPage: number): {
    next: () => void;
    prev: () => void;
    jump: (page: number) => void;
    currentData: () => any;
    currentPage: number;
    maxPage: number;
};
//# sourceMappingURL=usePagination.d.ts.map