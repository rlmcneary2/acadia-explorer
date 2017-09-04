

function searchStringToArray(search: string): { key: string, value: string }[] {
    if (search.length < 1) {
        return [];
    }

    let s = search;
    while (0 < s.length && /^(\?|\s)/.test(s)) {
        s = s.substr(1);
    }

    const params = s.split("&");
    return params.map(item => {
        const [key, value] = item.split("=");
        return { key, value };
    });
}


export { searchStringToArray };
