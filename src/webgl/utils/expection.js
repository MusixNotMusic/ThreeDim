export function fail(msg) {
    const elem = document.querySelector('#fail');
    const contentElem = elem.querySelector('.content');
    elem.style.display = '';
    contentElem.textContent = msg;
}