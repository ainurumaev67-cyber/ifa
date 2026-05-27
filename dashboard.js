const btnColor = document.getElementById('btn-color');
const btnText = document.getElementById('btn-text');
const winWidth = document.getElementById('win-width');
const winHeight = document.getElementById('win-height');
const scriptOutput = document.getElementById('script-output');
const copyBtn = document.getElementById('copy-btn');

const WIDGET_URL = 'https://ifa.ainurumaev67.workers.dev/widget.js';

function generateScript() {
  const color = btnColor.value;
  const text = btnText.value;
  const width = winWidth.value;
  const height = winHeight.value;

  scriptOutput.value = `<script>
(function(w,d,s){
  w._ifaConfig = { color:"${color}", text:"${text}", width:${width}, height:${height} };
  var f=d.getElementsByTagName(s)[0], j=d.createElement(s);
  j.src="${WIDGET_URL}";
  f.parentNode.insertBefore(j,f);
})(window,document,"script");
</` + `script>`;
}

[btnColor, btnText, winWidth, winHeight].forEach(el =>
  el.addEventListener('input', generateScript)
);

copyBtn.addEventListener('click', () => {
  scriptOutput.select();
  document.execCommand('copy');
  copyBtn.textContent = 'Скопировано!';
  setTimeout(() => copyBtn.textContent = 'Скопировать', 2000);
});

generateScript();
