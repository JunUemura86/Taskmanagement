// ============================================================
// タスク管理アプリ 画面モック
// データはこのファイルの中だけにあります（保存はしません）。
// ページを読み込み直すと、最初の状態に戻ります。
// ============================================================

// ----- 日付の便利な関数 -----

// 今日から days 日後の日付を "2026-11-10" の形で返す
function dateFromToday(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// "2026-11-10" → 今年なら "11/10"、今年以外なら "2027/1/10"
function formatDue(due) {
  const [y, m, d] = due.split('-').map(Number);
  const thisYear = new Date().getFullYear();
  return y === thisYear ? `${m}/${d}` : `${y}/${m}/${d}`;
}

// 期限の状態を返す："overdue"（期限切れ）、"soon"（今日・明日）、""（通常）
function dueStatus(due) {
  const today = dateFromToday(0);
  const tomorrow = dateFromToday(1);
  if (due < today) return 'overdue';
  if (due === today || due === tomorrow) return 'soon';
  return '';
}

// 日本語の変換中のキー入力なら true を返す
// （Safari などでは、変換を確定する Enter で isComposing が false になるため、
//   変換中を表す keyCode 229 も合わせて確認する）
function isImeInput(e) {
  return e.isComposing || e.keyCode === 229;
}

// ----- サンプルデータ -----
// 期限の色分け（赤・黄・通常）がすべて見えるように、今日を基準に日付を作っています。

const LABEL_COLORS = ['red', 'yellow', 'green', 'blue', 'purple'];
// ラベルにマウスを乗せたときに出す名前
const LABEL_NAMES = { red: '赤', yellow: '黄', green: '緑', blue: '青', purple: '紫' };

// 優先度（上から 高・中・低 の順）
const PRIORITIES = ['high', 'medium', 'low'];
const PRIORITY_TEXT = { high: '↑ 高', medium: '→ 中', low: '↓ 低' };

// 並べ替えのプルダウンの選択肢
const SORT_OPTIONS = [
  { key: 'priority', text: '優先度順' },
  { key: 'due', text: '期限順' },
  { key: 'label', text: 'カテゴリ別' },
  { key: 'created', text: '追加した順' },
];

let lists = [
  {
    id: 1,
    name: '未着手',
    isDone: false,
    sortKey: '', // いま適用している並べ替え（''＝手動の順番）
    cards: [
      { id: 1, title: '資料作成', due: dateFromToday(7), label: 'red', priority: 'high' },
      { id: 2, title: 'メール返信', due: dateFromToday(-4), label: null, priority: 'medium' },
      { id: 3, title: '企画書のレビュー', due: dateFromToday(0), label: 'green', priority: 'high' },
      { id: 4, title: '来年の計画を立てる', due: dateFromToday(70), label: null, priority: 'low' },
    ],
  },
  {
    id: 2,
    name: '進行中',
    isDone: false,
    sortKey: '',
    cards: [
      { id: 5, title: '会議準備', due: dateFromToday(1), label: 'blue', priority: 'medium' },
      { id: 6, title: '週報まとめ', due: null, label: 'purple', priority: 'low' },
    ],
  },
  {
    id: 3,
    name: '完了',
    isDone: true, // 完了用リスト（期限の色分けをしない）
    sortKey: '',
    cards: [
      { id: 7, title: '請求書', due: dateFromToday(-14), label: null, priority: 'high' },
      { id: 8, title: '見積書', due: dateFromToday(-10), label: 'yellow', priority: 'medium' },
    ],
  },
];

let nextCardId = 9; // 新しいカードに付ける番号
let nextListId = 4; // 新しいリストに付ける番号

// ----- 画面の状態 -----
let addingListId = null;   // 「＋カードを追加」の入力欄を開いているリストの id
let addCardError = '';     // その入力欄の下に出すエラー
let isAddingList = false;  // 「＋リストを追加」の入力欄を開いているか
let addListError = '';     // その入力欄の下に出すエラー
let renamingListId = null; // 名前を変更中のリストの id
let menuListId = null;     // 「…」メニューを開いているリストの id
let selectedCardIds = new Set(); // チェックを入れたカードの id（リストをまたいでもよい）
let draggingCardId = null; // ドラッグ中のカードの id
let dropTarget = null;     // ドロップする場所 { listId, index }

// メッセージ（画面設計書「5. メッセージの一覧」）
const MESSAGES = {
  M01: (title) => `カード「${title}」を削除します。よろしいですか？`,
  M02: (count) => `選択した${count}件のカードを削除します。よろしいですか？`,
  M03: (name, count) => `リスト「${name}」を削除します。中のカード${count}件も削除されます。よろしいですか？`,
  M04: 'リスト名を入力してください。',
  M05: 'タイトルを入力してください。',
};

// 入力欄をすべて閉じる（同時に開く入力欄は1つだけにする）
function closeAllInputs() {
  addingListId = null;
  addCardError = '';
  isAddingList = false;
  addListError = '';
  renamingListId = null;
  menuListId = null;
}

// ----- 画面に表示する -----

const boardEl = document.getElementById('board');

function render() {
  boardEl.innerHTML = '';

  for (const list of lists) {
    boardEl.appendChild(createListElement(list));
  }

  // 一番右に「＋リストを追加」（押すと入力欄に変わる）
  boardEl.appendChild(isAddingList ? createAddListForm() : createAddListButton());

  updateBulkDeleteButton();
}

// ----- ドラッグ＆ドロップ（UC-05 移動、UC-06 並べ替え） -----

// ドロップする場所を示す点線の枠
const placeholder = document.createElement('div');
placeholder.className = 'drop-placeholder';

// ドラッグ中、マウスの位置からカードを入れる場所を決めて、点線の枠を出す
function handleDragOver(e, list, cardListEl) {
  if (draggingCardId === null) return;
  e.preventDefault(); // これでドロップできるようになる
  e.dataTransfer.dropEffect = 'move';

  // ドラッグ中のカード以外のカードの中で、マウスより下にある最初のカードの前に入れる
  const others = [...cardListEl.querySelectorAll('.card')]
    .filter((el) => Number(el.dataset.cardId) !== draggingCardId);
  let index = others.length;
  for (let i = 0; i < others.length; i++) {
    const rect = others[i].getBoundingClientRect();
    if (e.clientY < rect.top + rect.height / 2) {
      index = i;
      break;
    }
  }

  if (index < others.length) {
    cardListEl.insertBefore(placeholder, others[index]);
  } else {
    cardListEl.appendChild(placeholder);
  }
  dropTarget = { listId: list.id, index };
}

// カードを移動する（同じリストなら並べ替え）
function moveCard(cardId, toListId, index) {
  const fromList = lists.find((l) => l.cards.some((c) => c.id === cardId));
  const toList = lists.find((l) => l.id === toListId);
  if (!fromList || !toList) return;
  const card = fromList.cards.find((c) => c.id === cardId);
  fromList.cards = fromList.cards.filter((c) => c !== card);
  toList.cards.splice(index, 0, card);
  // 手で動かしたので、移動先のリストは「並べ替えた状態」ではなくなる
  toList.sortKey = '';
}

// ----- 並べ替え（プルダウン） -----

// 期限を比べる（期限なしは一番下）
function compareDue(a, b) {
  if (a.due === b.due) return 0;
  if (a.due === null) return 1;
  if (b.due === null) return -1;
  return a.due < b.due ? -1 : 1;
}

// ラベルを比べる（赤→黄→緑→青→紫、ラベルなしは一番下）
function compareLabel(a, b) {
  const order = (c) => (c.label === null ? LABEL_COLORS.length : LABEL_COLORS.indexOf(c.label));
  return order(a) - order(b);
}

// 追加した順（id が小さいほど先に追加したカード）
function compareCreated(a, b) {
  return a.id - b.id;
}

function comparePriority(a, b) {
  return PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority);
}

// 並べ替えのルール。同じ順位のときは、次の条件で比べる
const SORT_RULES = {
  priority: [comparePriority, compareDue, compareCreated], // 優先度 → 期限 → 追加した順
  due: [compareDue, comparePriority, compareCreated],      // 期限 → 優先度 → 追加した順
  label: [compareLabel, comparePriority, compareCreated],  // カテゴリ → 優先度 → 追加した順
  created: [compareCreated],
};

// リストの中のカードを、選んだ条件で並べ替える（並べ替えたあともドラッグで動かせる）
function sortList(list, key) {
  const rules = SORT_RULES[key];
  list.cards.sort((a, b) => {
    for (const rule of rules) {
      const result = rule(a, b);
      if (result !== 0) return result;
    }
    return 0;
  });
  list.sortKey = key;
  render();
}

function createSortSelect(list) {
  const row = document.createElement('div');
  row.className = 'sort-row';

  const select = document.createElement('select');
  select.className = 'sort-select';
  select.setAttribute('aria-label', `「${list.name}」の並べ替え`);
  select.disabled = list.cards.length < 2; // 2枚以上ないと並べ替えられない

  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = '並べ替え…';
  placeholderOption.disabled = true;
  select.appendChild(placeholderOption);

  for (const opt of SORT_OPTIONS) {
    const option = document.createElement('option');
    option.value = opt.key;
    option.textContent = opt.text;
    select.appendChild(option);
  }
  select.value = list.sortKey;
  select.addEventListener('change', () => sortList(list, select.value));

  row.appendChild(select);
  return row;
}

function endDrag() {
  draggingCardId = null;
  dropTarget = null;
  placeholder.remove();
  render();
}

// リストの外にマウスが出たら点線の枠を消す（そこで離しても元の位置のまま）
document.addEventListener('dragover', (e) => {
  if (draggingCardId === null) return;
  if (!(e.target instanceof Element) || !e.target.closest('.list')) {
    placeholder.remove();
    dropTarget = null;
  }
});

// ----- カードの選択と一括削除（UC-10） -----

const bulkDeleteBtn = document.getElementById('bulk-delete-btn');

// ヘッダーのボタンの件数を更新する（0件のときは押せない）
function updateBulkDeleteButton() {
  // 削除済みのカードの id が残らないように整理する
  const existingIds = new Set(lists.flatMap((l) => l.cards.map((c) => c.id)));
  for (const id of selectedCardIds) {
    if (!existingIds.has(id)) selectedCardIds.delete(id);
  }
  const count = selectedCardIds.size;
  bulkDeleteBtn.textContent = `選択したカードを削除（${count}件）`;
  bulkDeleteBtn.disabled = count === 0;
}

function toggleCardSelected(card, checked) {
  if (checked) {
    selectedCardIds.add(card.id);
  } else {
    selectedCardIds.delete(card.id);
  }
  render();
}

// 「すべて選択」：リストのカードをすべて選ぶ／すべて外す
function toggleSelectAll(list, checked) {
  for (const card of list.cards) {
    if (checked) {
      selectedCardIds.add(card.id);
    } else {
      selectedCardIds.delete(card.id);
    }
  }
  render();
}

// 選んだカードをまとめて削除する（確認メッセージ M-02 を出す）
bulkDeleteBtn.addEventListener('click', () => {
  const count = selectedCardIds.size;
  if (count === 0) return;
  if (!confirm(MESSAGES.M02(count))) return; // キャンセル → チェックは残す
  for (const list of lists) {
    list.cards = list.cards.filter((c) => !selectedCardIds.has(c.id));
  }
  selectedCardIds.clear();
  render();
});

// ----- リストの追加（UC-07） -----

function createAddListButton() {
  const btn = document.createElement('button');
  btn.className = 'add-list-btn';
  btn.textContent = '＋ リストを追加';
  btn.addEventListener('click', () => {
    closeAllInputs();
    isAddingList = true;
    render();
    document.getElementById('add-list-input').focus();
  });
  return btn;
}

function createAddListForm() {
  const form = document.createElement('div');
  form.className = 'add-list-form';

  const input = document.createElement('input');
  input.id = 'add-list-input';
  input.type = 'text';
  input.className = 'input';
  input.maxLength = 30; // 30文字を超えて打ち込めない
  input.placeholder = 'リスト名';

  const errorEl = document.createElement('p');
  errorEl.className = 'error-text';
  errorEl.textContent = addListError;
  errorEl.hidden = !addListError;

  input.addEventListener('input', () => {
    addListError = '';
    errorEl.hidden = true;
  });

  input.addEventListener('keydown', (e) => {
    if (isImeInput(e)) return;
    if (e.key === 'Enter') {
      addList(input.value);
    } else if (e.key === 'Escape') {
      closeAllInputs();
      render();
    }
  });

  const hint = document.createElement('p');
  hint.className = 'hint-text';
  hint.textContent = 'Enter で追加 ／ Esc でやめる';

  form.append(input, errorEl, hint);
  return form;
}

// リストを一番右に追加する
function addList(rawName) {
  const name = rawName.trim();
  if (name === '') {
    addListError = MESSAGES.M04;
    render();
    const input = document.getElementById('add-list-input');
    input.value = rawName;
    input.focus();
    return;
  }
  lists.push({ id: nextListId++, name, isDone: false, sortKey: '', cards: [] });
  closeAllInputs();
  render();
}

// ----- リスト名の変更（UC-08） -----

function createRenameInput(list) {
  const input = document.createElement('input');
  input.id = 'rename-input';
  input.type = 'text';
  input.className = 'input list-name-input';
  input.maxLength = 30;
  input.value = list.name;

  input.addEventListener('keydown', (e) => {
    if (isImeInput(e)) return;
    if (e.key === 'Enter') {
      finishRename(list, input.value);
    } else if (e.key === 'Escape') {
      finishRename(list, ''); // 元の名前に戻す
    }
  });
  // 入力欄の外をクリックしたときも確定する
  input.addEventListener('blur', () => finishRename(list, input.value));
  return input;
}

function finishRename(list, rawName) {
  if (renamingListId !== list.id) return; // すでに終わっている
  const name = rawName.trim();
  if (name !== '') list.name = name; // 空なら元の名前のまま
  renamingListId = null;
  render();
}

// ----- 「…」メニュー（UC-09、UC-11） -----

function createListMenu(list) {
  const wrap = document.createElement('div');
  wrap.className = 'list-menu-wrap';

  const menuBtn = document.createElement('button');
  menuBtn.className = 'list-menu-btn';
  menuBtn.textContent = '…';
  menuBtn.title = 'メニュー';
  menuBtn.addEventListener('click', () => {
    const isOpen = menuListId === list.id;
    closeAllInputs();
    menuListId = isOpen ? null : list.id;
    render();
  });
  wrap.appendChild(menuBtn);

  if (menuListId === list.id) {
    const menu = document.createElement('div');
    menu.className = 'list-menu';

    const doneItem = document.createElement('button');
    doneItem.className = 'list-menu-item';
    doneItem.textContent = list.isDone ? '完了用リストを解除' : '完了用リストにする';
    doneItem.addEventListener('click', () => toggleDoneList(list));

    const deleteItem = document.createElement('button');
    deleteItem.className = 'list-menu-item danger';
    deleteItem.textContent = 'リストを削除';
    deleteItem.addEventListener('click', () => deleteList(list));

    menu.append(doneItem, deleteItem);
    wrap.appendChild(menu);
  }
  return wrap;
}

// 完了用リストにする／解除する（完了用リストは1つだけ）
function toggleDoneList(list) {
  if (list.isDone) {
    list.isDone = false;
  } else {
    for (const l of lists) l.isDone = false; // 前の指定を外す
    list.isDone = true;
  }
  menuListId = null;
  render();
}

// リストを削除する（確認メッセージ M-03 を出す）
function deleteList(list) {
  menuListId = null;
  render();
  if (!confirm(MESSAGES.M03(list.name, list.cards.length))) return;
  lists = lists.filter((l) => l !== list);
  render();
}

// メニューの外をクリックしたらメニューを閉じる
document.addEventListener('click', (e) => {
  if (menuListId !== null && !e.target.closest('.list-menu-wrap')) {
    menuListId = null;
    render();
  }
});

function createListElement(list) {
  const listEl = document.createElement('section');
  listEl.className = 'list';

  // 見出し：すべて選択 / リスト名 / ✓ / …
  const header = document.createElement('div');
  header.className = 'list-header';

  const selectAll = document.createElement('input');
  selectAll.type = 'checkbox';
  selectAll.title = 'すべて選択';
  const selectedInList = list.cards.filter((c) => selectedCardIds.has(c.id)).length;
  selectAll.disabled = list.cards.length === 0; // カードがないときは押せない
  selectAll.checked = list.cards.length > 0 && selectedInList === list.cards.length;
  // 一部だけ選んでいるときは「－」の表示にする
  selectAll.indeterminate = selectedInList > 0 && selectedInList < list.cards.length;
  selectAll.addEventListener('change', () => toggleSelectAll(list, selectAll.checked));

  let name;
  if (renamingListId === list.id) {
    name = createRenameInput(list);
  } else {
    name = document.createElement('span');
    name.className = 'list-name';
    name.textContent = list.name;
    name.title = 'クリックして名前を変更';
    name.addEventListener('click', () => {
      closeAllInputs();
      renamingListId = list.id;
      render();
      const input = document.getElementById('rename-input');
      input.focus();
      input.select();
    });
  }

  header.append(selectAll, name);

  if (list.isDone) {
    const mark = document.createElement('span');
    mark.className = 'done-mark';
    mark.textContent = '✓';
    mark.title = '完了用リスト';
    header.appendChild(mark);
  }

  header.appendChild(createListMenu(list));

  // カード
  const cardList = document.createElement('div');
  cardList.className = 'card-list';
  for (const card of list.cards) {
    cardList.appendChild(createCardElement(card, list));
  }

  // ＋カードを追加（押すと入力欄に変わる）
  const addArea = addingListId === list.id
    ? createAddCardForm(list)
    : createAddCardButton(list);

  listEl.append(header, createSortSelect(list), cardList, addArea);

  // リストのどこにドラッグしても入れられるようにする
  listEl.addEventListener('dragover', (e) => handleDragOver(e, list, cardList));
  listEl.addEventListener('drop', (e) => {
    e.preventDefault();
    if (draggingCardId !== null && dropTarget) {
      moveCard(draggingCardId, dropTarget.listId, dropTarget.index);
    }
    endDrag();
  });

  return listEl;
}

function createAddCardButton(list) {
  const btn = document.createElement('button');
  btn.className = 'add-card-btn';
  btn.textContent = '＋ カードを追加';
  btn.addEventListener('click', () => {
    closeAllInputs();
    addingListId = list.id;
    render();
    document.getElementById('add-card-input').focus();
  });
  return btn;
}

function createAddCardForm(list) {
  const form = document.createElement('div');
  form.className = 'add-card-form';

  const input = document.createElement('input');
  input.id = 'add-card-input';
  input.type = 'text';
  input.className = 'input';
  input.maxLength = 100; // 100文字を超えて打ち込めない
  input.placeholder = 'カードのタイトル';

  input.addEventListener('input', () => {
    // 入力し直したらエラーを消す
    if (addCardError) {
      addCardError = '';
      errorEl.hidden = true;
    }
  });

  input.addEventListener('keydown', (e) => {
    if (isImeInput(e)) return; // 日本語の変換中の Enter は無視する
    if (e.key === 'Enter') {
      addCard(list, input.value);
    } else if (e.key === 'Escape') {
      addingListId = null;
      addCardError = '';
      render();
    }
  });

  const errorEl = document.createElement('p');
  errorEl.className = 'error-text';
  errorEl.textContent = addCardError;
  errorEl.hidden = !addCardError;

  const hint = document.createElement('p');
  hint.className = 'hint-text';
  hint.textContent = 'Enter で追加 ／ Esc でやめる';

  form.append(input, errorEl, hint);
  return form;
}

// カードをリストの一番下に追加する
function addCard(list, rawTitle) {
  const title = rawTitle.trim(); // 前後の空白を取り除く
  if (title === '') {
    addCardError = MESSAGES.M05;
  } else {
    // 優先度は最初は「中」
    list.cards.push({ id: nextCardId++, title, due: null, label: null, priority: 'medium' });
    list.sortKey = ''; // 一番下に足したので、並べ替えた状態ではなくなる
    addCardError = '';
  }
  // 続けて入力できるよう、入力欄は開いたままにする
  render();
  const input = document.getElementById('add-card-input');
  input.focus();
  if (addCardError) input.value = rawTitle;
}

function createCardElement(card, list) {
  const cardEl = document.createElement('div');
  cardEl.className = 'card';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = selectedCardIds.has(card.id);
  if (checkbox.checked) cardEl.classList.add('selected');
  // チェックボックスを押したときは編集画面を開かない
  checkbox.addEventListener('click', (e) => e.stopPropagation());
  checkbox.addEventListener('change', () => toggleCardSelected(card, checkbox.checked));

  // ラベル（カテゴリ）：カードの上の端に細い色の帯で表示する
  if (card.label) {
    const strip = document.createElement('span');
    strip.className = `label-strip label-${card.label}`;
    strip.title = `ラベル：${LABEL_NAMES[card.label]}`;
    cardEl.classList.add('has-label');
    cardEl.appendChild(strip);
  }

  const body = document.createElement('div');
  body.className = 'card-body';

  const titleRow = document.createElement('div');
  titleRow.className = 'card-title-row';

  const title = document.createElement('span');
  title.className = 'card-title';
  title.textContent = card.title;

  // 優先度：右上に矢印と文字の入ったバッジで表示する
  const badge = document.createElement('span');
  badge.className = `priority-badge priority-${card.priority}`;
  badge.textContent = PRIORITY_TEXT[card.priority];
  badge.title = '優先度';

  titleRow.append(title, badge);
  body.appendChild(titleRow);

  if (card.due) {
    const dueEl = document.createElement('div');
    dueEl.className = 'card-due';
    // 完了用リストのカードは色分けしない
    const status = list.isDone ? '' : dueStatus(card.due);
    if (status) dueEl.classList.add(status);
    dueEl.textContent = status === 'overdue'
      ? `期限切れ ${formatDue(card.due)}`
      : formatDue(card.due);
    body.appendChild(dueEl);
  }

  cardEl.append(checkbox, body);
  cardEl.addEventListener('click', () => openEditModal(card, list));

  // ドラッグ＆ドロップ
  cardEl.draggable = true;
  cardEl.dataset.cardId = card.id;
  cardEl.addEventListener('dragstart', (e) => {
    draggingCardId = card.id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(card.id)); // Firefox ではこれがないとドラッグできない
    // ドラッグ中の画像が薄くならないよう、少し遅らせて元のカードを薄くする
    requestAnimationFrame(() => cardEl.classList.add('dragging'));
  });
  // リストの外で離したときなどは、元の位置のまま表示し直す
  cardEl.addEventListener('dragend', () => {
    if (draggingCardId !== null) endDrag();
  });
  return cardEl;
}

// ----- SC-02 カード編集画面 -----

const overlay = document.getElementById('modal-overlay');
const editTitle = document.getElementById('edit-title');
const editTitleError = document.getElementById('edit-title-error');
const editDue = document.getElementById('edit-due');
const labelPicker = document.getElementById('edit-labels');
const priorityPicker = document.getElementById('edit-priority');
let selectedLabel = null;
let selectedPriority = 'medium';
let editingCard = null; // 編集中のカード
let editingList = null; // 編集中のカードが入っているリスト

function renderLabelPicker() {
  labelPicker.innerHTML = '';

  const none = document.createElement('button');
  none.className = 'label-option label-none';
  none.textContent = 'なし';
  if (selectedLabel === null) none.classList.add('selected');
  none.addEventListener('click', () => { selectedLabel = null; renderLabelPicker(); });
  labelPicker.appendChild(none);

  for (const color of LABEL_COLORS) {
    const btn = document.createElement('button');
    btn.className = `label-option label-${color}`;
    btn.setAttribute('aria-label', LABEL_NAMES[color]);
    btn.title = LABEL_NAMES[color];
    if (selectedLabel === color) btn.classList.add('selected');
    btn.addEventListener('click', () => { selectedLabel = color; renderLabelPicker(); });
    labelPicker.appendChild(btn);
  }
}

// 優先度を選ぶボタン（高・中・低）
function renderPriorityPicker() {
  priorityPicker.innerHTML = '';
  for (const p of PRIORITIES) {
    const btn = document.createElement('button');
    btn.className = `priority-option priority-${p}`;
    btn.textContent = PRIORITY_TEXT[p];
    if (selectedPriority === p) btn.classList.add('selected');
    btn.addEventListener('click', () => { selectedPriority = p; renderPriorityPicker(); });
    priorityPicker.appendChild(btn);
  }
}

function openEditModal(card, list) {
  editingCard = card;
  editingList = list;
  editTitle.value = card.title;
  editDue.value = card.due || '';
  selectedLabel = card.label;
  selectedPriority = card.priority;
  editTitleError.hidden = true;
  renderPriorityPicker();
  renderLabelPicker();
  overlay.hidden = false;
  editTitle.focus();
}

// 変更を保存せずに閉じる
function closeEditModal() {
  overlay.hidden = true;
  editingCard = null;
  editingList = null;
}

// 「保存」
function saveEdit() {
  const title = editTitle.value.trim();
  if (title === '') {
    editTitleError.textContent = MESSAGES.M05;
    editTitleError.hidden = false;
    editTitle.focus();
    return;
  }
  editingCard.title = title;
  editingCard.due = editDue.value || null;
  editingCard.label = selectedLabel;
  editingCard.priority = selectedPriority;
  editingList.sortKey = ''; // 内容が変わったので、並べ替えた状態ではなくなる
  closeEditModal();
  render();
}

// 「削除」（確認メッセージ M-01 を出す）
function deleteFromEdit() {
  if (!confirm(MESSAGES.M01(editingCard.title))) {
    return; // キャンセル → 編集画面に戻る
  }
  editingList.cards = editingList.cards.filter((c) => c !== editingCard);
  closeEditModal();
  render();
}

document.getElementById('modal-close').addEventListener('click', closeEditModal);
document.getElementById('edit-save').addEventListener('click', saveEdit);
document.getElementById('edit-delete').addEventListener('click', deleteFromEdit);
editTitle.addEventListener('input', () => { editTitleError.hidden = true; });
editTitle.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !isImeInput(e)) saveEdit();
});
document.getElementById('edit-due-clear').addEventListener('click', () => { editDue.value = ''; });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !overlay.hidden) closeEditModal();
});

// ----- お知らせ欄（ステップ1では見た目の確認用に表示例を出す） -----

const notice = document.getElementById('notice');
document.getElementById('notice-text').textContent =
  '（表示例）サーバーに接続できませんでした。サーバーが起動しているか確認してください。';
notice.hidden = false;
document.getElementById('notice-close').addEventListener('click', () => { notice.hidden = true; });

// ----- 最初の表示 -----
render();
