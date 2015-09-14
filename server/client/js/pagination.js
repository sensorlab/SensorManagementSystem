function paginate(num, elementsPerPage) {
    var elementsTotal = document.getElementsByClassName('history_border').length;
    var pagesTotal = Math.ceil(elementsTotal / elementsPerPage);
    console.log("Pagination function call! no of pages = " + pagesTotal + " total elements = " + elementsTotal);

    if (num > (pagesTotal - 1))
        return;

    var elementsAll = document.getElementsByClassName('history_border');

    for (var i = 0; i < elementsTotal; i++)
        elementsAll[i].className += ' hidden';

    if (num < (pagesTotal - 1))
        for (var i = num * elementsPerPage; i < (num + 1) * elementsPerPage; i++)
            elementsAll[i].className = elementsAll[i].className.substring(0, elementsAll[i].className.indexOf(' hidden'));

    else
        for (var i = num * elementsPerPage; i < elementsTotal; i++)
            elementsAll[i].className = elementsAll[i].className.substring(0, elementsAll[i].className.indexOf(' hidden'));

    return pagesTotal;

}