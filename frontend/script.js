let currentMode = 'saliency';

/*
querySelectorAll(指定したCSSセレクタに一致するすべての要素を取得できる)で取得した要素に対してforEachで
各タブ要素にクリックイベントリスナーを追加する。
クリックされたタブのactiveクラスを付与し、他のタブからはactiveクラスを削除する。
*/
document.querySelectorAll('.tab').forEach(function(tab) {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentMode = tab.getAttribute('data-mode');
  });
});

async function processImages() {
  const loadingElement = document.getElementById('loading');
  loadingElement.style.display = 'flex'; // ローディングを表示

  //1.ファイル選択の取得
  const fileInput = document.getElementById('image-input'); //HTMLの<input type="file">要素を取得
  const files = fileInput.files; // 選択されたファイルのリスト

  // files.lengthが0の場合、つまり画像が選択されていない場合はアラートを表示して処理を終了する。
  if (!files.length) {
    alert('画像を選択してください');
    loadingElement.style.display = 'none'; // ローディングを非表示
    return;
  }

  // files.lengthが1以上の場合、つまり画像が選択されている場合は、以下の処理を実行する。
  //2.FormDataの構築
  const formData = new FormData();//htmlの<form>要素を作成する。FormDataは、フォームのデータを簡単に構築できるオブジェクト。
  // FormDataオブジェクトに、選択された画像ファイルを追加する。
  for (const file of files) {
    formData.append('images', file);
  }
  formData.append('mode', currentMode);

  //3.非同期通信処理
  document.getElementById('loading').style.display = 'block';// ローディング表示を有効にする(display:noneからblockに変更)
  document.getElementById('result-images').innerHTML = ''; // 以前の結果画像をクリア

  //POSTはサーバーにデータを送信するメソッド
  const res = await fetch('http://localhost:5000/process', {
    method: 'POST',
    body: formData //FormDataオブジェクトをそのまま送信する。
  });

  //4.レスポンス処理
  const data = await res.json(); //
  const container = document.getElementById('result-images');

  // 受け取った画像データを表示するためのimg要素を作成し、src属性にbase64エンコードされた画像データを設定する。
  //base64はバイナリデータをテキスト形式で扱えるため、画像やファイル(binary)などをHTTPリクエストの本文などに埋め込んで送信することが可能
  //JSONやXMLなどのフォーマットではBase64が使われ、解析やデータ交換が容易になる。

  data.images.forEach(base64Image => { //アロー関数を試してみる。
    const img = document.createElement('img');
    img.src = 'data:image/png;base64,' + base64Image;
    img.style.maxWidth = '80%';
    img.style.margin = '10px';
    container.appendChild(img);
  });

  document.getElementById('loading').style.display = 'none';

  // 画像が読み込まれた後にカルーセルを更新
  setTimeout(() => {
    currentIndex = 0; // 初期インデックスを設定
    updateCarousel();
  }, 100); // 少し遅延させて画像の幅を正しく取得
}

/*zip対応前
function downloadAll() {
  const images = document.querySelectorAll('#result-images img');
  images.forEach((img, index) => {
    const link = document.createElement('a');
    link.href = img.src;
    link.download = `result_image_${index + 1}_${currentMode}.png`; // ファイル名を設定
    link.click();
  });
}
*/

async function downloadAll() {
  const images = document.querySelectorAll('#result-images img');
  const zip = new JSZip(); // JSZipインスタンスを作成
  const folder = zip.folder('result_images'); // ZIP内のフォルダを作成

  // 各画像をZIPに追加
  images.forEach((img, index) => {
    const imgData = img.src.split(',')[1]; // Base64データを取得
    const fileName = `result_image_${index + 1}_${currentMode}.png`; // ファイル名を設定
    folder.file(fileName, imgData, { base64: true }); // ZIPに画像を追加
  });

  // ZIPファイルを生成してダウンロード
  const content = await zip.generateAsync({ type: 'blob' }); // ZIPをBlob形式で生成
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = 'result_images.zip'; // ZIPファイル名を設定
  link.click();
}
let currentIndex = 0;

function updateCarousel() {
  const resultImages = document.getElementById('result-images');
  const images = resultImages.querySelectorAll('img');
  if (images.length === 0) return; // 画像がない場合は処理を終了

  const imageWidth = images[0].offsetWidth; // 画像の幅を取得
  const gap = 10; // 画像間のスペース
  const carouselWidth = document.getElementById('carousel').offsetWidth; // カルーセルの幅

  // 現在のスライド位置を計算
  const offset = -(currentIndex * (imageWidth + gap)) + (carouselWidth - imageWidth) / 2;

  // スライド位置を適用
  resultImages.style.transform = `translateX(${offset}px)`;
}

// 左ボタン
document.getElementById('prev-btn').addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    updateCarousel();
  }
});

// 右ボタン
document.getElementById('next-btn').addEventListener('click', () => {
  const resultImages = document.getElementById('result-images');
  const images = resultImages.querySelectorAll('img');
  if (currentIndex < images.length - 1) {
    currentIndex++;
    updateCarousel();
  }
});


//三段階モード用
// ヘッダー切り替え
document.getElementById('classic-mode-btn').onclick = () => {
  document.getElementById('classic-mode-btn').classList.add('active');
  document.getElementById('step-mode-btn').classList.remove('active');
  document.getElementById('classic-page').style.display = '';
  document.getElementById('step-page').style.display = 'none';
};
document.getElementById('step-mode-btn').onclick = () => {
  document.getElementById('step-mode-btn').classList.add('active');
  document.getElementById('classic-mode-btn').classList.remove('active');
  document.getElementById('classic-page').style.display = 'none';
  document.getElementById('step-page').style.display = '';
};

// 三段階モード進行
let stepOriginalDataUrl = '';
let stepHeatmapDataUrl = '';
let feedback1 = '', feedback2 = '', feedback3 = '';

// 画像アップロード＆開始
document.getElementById('step-start-btn').onclick = async () => {
  const file = document.getElementById('step-image-input').files[0];
  if (!file) { alert('画像を選択してください'); return; }
  // 画像表示
  stepOriginalDataUrl = URL.createObjectURL(file);
  document.getElementById('step-original-image').src = stepOriginalDataUrl;
  document.getElementById('step-original-image2').src = stepOriginalDataUrl;
  document.getElementById('step1').style.display = '';
  document.getElementById('step2').style.display = 'none';
  document.getElementById('step3').style.display = 'none';
  document.getElementById('step-finish').style.display = 'none';
};

// 1→2
document.getElementById('step1-next').onclick = async () => {
  feedback1 = document.getElementById('feedback1').value;
  if (!feedback1) { alert('感想を入力してください'); return; }
  // サーバーに画像送信＆ヒートマップ取得
  const file = document.getElementById('step-image-input').files[0];
  const mode = document.querySelector('.tab.active').dataset.mode;
  const formData = new FormData();
  formData.append('images', file);
  formData.append('mode', mode);
  const res = await fetch('http://localhost:5000/process', { method: 'POST', body: formData });
  const data = await res.json();
  stepHeatmapDataUrl = 'data:image/png;base64,' + data.images[0];
  document.getElementById('step-heatmap-image').src = stepHeatmapDataUrl;
  document.getElementById('step-heatmap-image2').src = stepHeatmapDataUrl;
  document.getElementById('step1').style.display = 'none';
  document.getElementById('step2').style.display = '';
};

// 2→3
document.getElementById('step2-next').onclick = () => {
  feedback2 = document.getElementById('feedback2').value;
  if (!feedback2) { alert('感想を入力してください'); return; }
  document.getElementById('step2').style.display = 'none';
  document.getElementById('step3').style.display = '';
};

// 3→完了
document.getElementById('step3-finish').onclick = () => {
  feedback3 = document.getElementById('feedback3').value;
  if (!feedback3) { alert('感想を入力してください'); return; }
  document.getElementById('show-feedback1').textContent = feedback1;
  document.getElementById('show-feedback2').textContent = feedback2;
  document.getElementById('show-feedback3').textContent = feedback3;
  document.getElementById('step3').style.display = 'none';
  document.getElementById('step-finish').style.display = '';
};

// ダウンロード
document.getElementById('step-download-btn').onclick = async () => {
  const zip = new JSZip();
  // 画像
  const fileInput = document.getElementById('step-image-input');
  const file = fileInput.files[0];
  const originalName = file ? file.name.replace(/\.[^/.]+$/, "") : "result";
  const originalBlob = await fetch(stepOriginalDataUrl).then(r => r.blob());
  zip.file('original.png', originalBlob);
  const heatmapBlob = await fetch(stepHeatmapDataUrl).then(r => r.blob());
  zip.file('heatmap.png', heatmapBlob);
  // テキスト
  const txt = `一回目: ${feedback1}\n二回目: ${feedback2}\n三回目: ${feedback3}`;
  zip.file('feedback.txt', txt);
  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = `${originalName}_result.zip`;
  link.click();
};

// 拡大ボタン
document.querySelectorAll('.fullscreen-btn').forEach(btn => {
  btn.onclick = () => {
    const targetId = btn.getAttribute('data-target');
    const img = document.getElementById(targetId);
    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.top = 0;
    popup.style.left = 0;
    popup.style.width = '100vw';
    popup.style.height = '100vh';
    popup.style.background = 'rgba(0,0,0,0.9)';
    popup.style.display = 'flex';
    popup.style.alignItems = 'center';
    popup.style.justifyContent = 'center';
    popup.style.zIndex = 10000;
    const popupImg = document.createElement('img');
    popupImg.src = img.src;
    popupImg.style.maxWidth = '90vw';
    popupImg.style.maxHeight = '90vh';
    popup.appendChild(popupImg);
    popup.onclick = () => document.body.removeChild(popup);
    document.body.appendChild(popup);
  };
});