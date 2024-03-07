/* ==================================================
    JSDoc型定義
   ================================================== */

/**
 * @typedef {object} MonstersJson monster.json自体の型定義.
 * @prop {Monster[]} monsters モンスターの情報一覧.
 */

/**
 * @typedef {object} Monster モンスターの情報.
 * @prop {string} id モンスターストライクアプリ上でのモンスターの図鑑番号.
 * @prop {string} relation 一番大元の進化形態のモンスターの図鑑番号.
 * @prop {string} dicId MONST DICTIONARY（旧：XFLAG DICTIONARY）の図鑑番号.
 * @prop {string} shortName モンスター名略称.(一番大元の進化形態のもののモンスター名と一致する.）
 * @prop {string} form 進化形態名.
 * @prop {string} formIdx 分岐進化がある場合のインデックス（分岐がない場合は0固定）.
 * @prop {string} element モンスターの属性（火/水/木/光/闇）.
 * @prop {string} gacha 排出されるガチャ名.
 * @prop {string} since 登場日（yyyy/MM/dd形式）.
 */

/**
 * @typedef {object} VueMonster モンスターの情報.
 * @prop {string} id 図鑑番号.
 * @prop {string} relation 一番大元の進化形態のモンスターの図鑑番号.
 * @prop {boolean} isFirstForm 一番最初の進化形態かどうか.
 * @prop {boolean} isLastForm 一番最後の進化形態かどうか.
 * @prop {string} png ボール絵のURL（png形式）　※MONST DICTIONARY（旧：XFLAG DICTIONARY）を直接参照.
 * @prop {string} webp ボール絵のURL（webp形式）　※MONST DICTIONARY（旧：XFLAG DICTIONARY）を直接参照.
 * @prop {string} url 当モンスターのMONST DICTIONARY（旧：XFLAG DICTIONARY）での紹介ページURL.
 * @prop {string} shortName モンスター名略称.(一番大元の進化形態のもののモンスター名と一致する.）
 * @prop {string} formName 進化形態名.
 * @prop {string} formFullName 進化形態名＋分岐があればインデックスも付与.
 * @prop {string} isOneSideForm 分岐進化の場合、1番目の形態かどうか（分岐がない場合は常にtrue）.
 * @prop {string} gacha 排出されるガチャ名.
 * @prop {string} element モンスターの属性（火属性/水属性/木属性/光属性/闇属性）.
 * @prop {string} year 登場年.
 * @prop {string} date 登場日（yyyy/MM/dd形式）.
 */

/* ==================================================
    定数定義
   ================================================== */
/** モンスター情報のJSONのURL. @type {string} */
const MONSTER_JSON_URL = 'monsters.json';

/** MONST DICTIONARY（旧：XFLAG DICTIONARY）のWebページへのルートURL. @type {string} */
const MONST_DICTIONARY_ROOT = 'https://dic.xflag.com/monsterstrike';

/** 属性フィルタ一覧. @type {string[]} */
const VIEW_SETTING_LIST = [
  'グリッド表示',
  'リスト表示'
];
/** ガチャフィルタデフォルト設定値. @type {string} */
const DEFAULT_VIEW_SETTING = VIEW_SETTING_LIST[0];

/** 属性フィルタ一覧. @type {string[]} */
const ELEMENT_LIST = [
  '火属性',
  '水属性',
  '木属性',
  '光属性',
  '闇属性'
];

/** 進化形態優先順一覧（リスト末尾の方が後の進化）. @type {string[]} */
const FORM_PRIORITY_LIST = [
  '進化前',
  '獣神化前',
  '真獣神化前',
  '進化',
  '神化',
  '獣神化',
  '獣神化・改',
  '真獣神化',
];


/** 進化形態フィルタ一覧. @type {string} */
const FORM_FILTER_LIST = [
  '全ての進化形態',
  '進化前のみ',
  FORM_PRIORITY_LIST[5],
  FORM_PRIORITY_LIST[6],
  FORM_PRIORITY_LIST[7],
];
/** 進化形態フィルタデフォルト設定値. @type {string} */
const DEFAULT_FORM_FILTER_NAME = FORM_FILTER_LIST[0];

/** ガチャフィルタデフォルト設定値. @type {string} */
const DEFAULT_GACHA_FILTER_NAME = '全てのガチャ';

/**
 * 
 * @param {Monster} monster 
 * @returns {number}
 */
function getFormNameSuffixNo(monster) {
  return parseInt(monster.formIdx, 10);
}

/**
 * 
 * @param {Monster} a 
 * @param {Monster} b 
 * @returns {number}
 */
function compareForm(a, b) {
  const aForm = FORM_PRIORITY_LIST.indexOf(a.form);
  const bForm = FORM_PRIORITY_LIST.indexOf(b.form);
  if (aForm > -1 && aForm === bForm) {
    return getFormNameSuffixNo(a) - getFormNameSuffixNo(b);
  } else {
    return aForm - bForm;
  }
}

async function getLimitedGachaInfo() {
  const res = await fetch(MONSTER_JSON_URL + '?' + (function (now) {
    return (now - now % (24 * 60 * 60 * 1000)) / 1000;
  }(Date.now())));

  /** @type {MonstersJson} */
  const monstersJson = await res.json();
  
  monstersJson.monsters.sort((a, b) => parseInt(a.id) - parseInt(b.id));

  /** @type {{[key:string]: Monster[]}>} */
  const evolutionMap = _.groupBy(
    monstersJson.monsters,
    /** @param {Monster} monster */
    (monster) => monster.relation);

  _.forIn(
    evolutionMap,
    /** @param {Monster[]} value @param {string} key */
    (value, key) => {
      evolutionMap[key].sort((a, b) => -compareForm(a, b));
    }
  );

  /** @type {VueMonster[]} */
  const monsters = _.map(
    monstersJson.monsters,
    /** @param {Monster} monster */
    (monster) => {
      const formIdx = getFormNameSuffixNo(monster);
      const evolitionList = evolutionMap[monster.relation];
      const since = new Date(monster.since);

      return {
        id: monster.id,
        relation: monster.relation,
        isFirstForm: monster.id === monster.relation,
        isLastForm: monster.form === evolitionList[0].form,
        png: `${MONST_DICTIONARY_ROOT}/assets-update/img/monster/${monster.dicId}/ball.png`,
        webp: `${MONST_DICTIONARY_ROOT}/assets-update/img/monster/${monster.dicId}/ball.webp`,
        url: `${MONST_DICTIONARY_ROOT}/character/${monster.dicId}/`,
        shortName: monster.shortName,
        formName: monster.form,
        formFullName: monster.form + (formIdx != 0 ? formIdx.toString() : ''),
        isOneSideForm: formIdx <= 1,
        gacha: monster.gacha,
        element: `${monster.element}属性`,
        year: `${since.getFullYear()}`,
        date: `${since.getFullYear()}/${since.getMonth() + 1}/${since.getDate()}`
      }
    }
  );

  return monsters;
}

// Vue設定
const { createApp, ref } = Vue;

createApp({
  setup() {
    /** @type {{value: VueMonster[]}} */
    const monsters = ref([]);

    /** @type {{value: string[]}} */
    const viewSettingList = ref(VIEW_SETTING_LIST);
    /** @type {{value: string}} */
    const selectedViewSetting = ref(DEFAULT_VIEW_SETTING);

    /** @type {{value: boolean}} */
    const useElementColorFilter = ref(true);
    /** @type {{value: boolean}} */
    const showId = ref(false);
    /** @type {{value: boolean}} */
    const showMonsterName = ref(false);

    /** @type {{value: string[]}} */
    const elements = ref(ELEMENT_LIST);
    /** @type {{value: string[]}} */
    const selectedElements = ref(ELEMENT_LIST);
    /** @type {{value: string[]}} */
    const gachas = ref([]);
    /** @type {{value: string}} */
    const selectedGacha = ref(DEFAULT_GACHA_FILTER_NAME);
    /** @type {{value: string[]}} */
    const formFilterList = ref(FORM_FILTER_LIST);
    /** @type {{value: string}} */
    const selectedFormFilter = ref(DEFAULT_FORM_FILTER_NAME);
    /** @type {{value: boolean}} */
    const onlyLatestForm = ref(false);
    /** @type {{value: boolean}} */
    const onlyOneSideForm = ref(false);

    /** @type {{value: string}} */
    const iconSize = ref('70');

    // Ajax実行用：非同期処理
    (async function() {
      // 画面表示用モンスターリストを生成
      const _monsters = await getLimitedGachaInfo();

      // ガチャリストを生成
      /** @type {string[]} */
      const gachaList = [
        DEFAULT_GACHA_FILTER_NAME
      ];
      _.forEach(
        _monsters,
        /** @param {Monster} monster */
        (monster) => {
          if (gachaList.indexOf(monster.gacha) === -1) {
            gachaList.push(monster.gacha);
          }
        }
      );

      // データバインディング設定
      monsters.value = _monsters;
      gachas.value = gachaList;
    }());

    /**
     * 画面上のフィルタ設定に則って、年ごとのモンスター一覧を生成して返却する.
     * @returns {{[year:string]:VueMonster[]}}
     */
    function calcMonstersGroup() {
      return _.groupBy(
        _.filter(monsters.value, (monster) => {
          if (selectedGacha.value !== DEFAULT_GACHA_FILTER_NAME &&
              monster.gacha !== selectedGacha.value) {
            return false;
          }
          if (onlyLatestForm.value && !monster.isLastForm) {
            return false;
          }
          if (onlyOneSideForm.value && !monster.isOneSideForm) {
            return false;
          }
          if (selectedFormFilter.value !== FORM_FILTER_LIST[0]) {
            if (selectedFormFilter.value === FORM_FILTER_LIST[1] && !monster.isFirstForm) {
              return false;
            }
            if (selectedFormFilter.value === FORM_FILTER_LIST[2] &&
                monster.formName !== FORM_FILTER_LIST[2]) {
              return false;
            }
            if (selectedFormFilter.value === FORM_FILTER_LIST[3] &&
                monster.formName !== FORM_FILTER_LIST[3]) {
              return false;
            }
            if (selectedFormFilter.value === FORM_FILTER_LIST[4] &&
                monster.formName !== FORM_FILTER_LIST[4]) {
              return false;
            }
          }
          if (selectedElements.value.indexOf(monster.element) === -1) {
            return false;
          }
          return true;
        }),
        (monster) => monster.year + '年');
    }

    /**
     * 属性フィルタリングで全属性をチェックONにする.
     */
    function onClickCheckAllElements() {
      selectedElements.value = ELEMENT_LIST;
    }

    /**
     * Bootstrapダークモードのトグルを切り替える.
     */
    function toggleDarkMode() {
      if (document.body.hasAttribute('data-bs-theme')) {
        document.body.removeAttribute('data-bs-theme');
      } else {
        document.body.setAttribute('data-bs-theme', 'dark');
      }
    }

    return {
      monsters,
      viewSettingList,
      selectedViewSetting,
      useElementColorFilter,
      showId,
      showMonsterName,
      elements,
      selectedElements,
      gachas,
      selectedGacha,
      formFilterList,
      selectedFormFilter,
      onlyLatestForm,
      onlyOneSideForm,
      iconSize,
      calcMonstersGroup,
      onClickCheckAllElements,
      toggleDarkMode
    }
  }
}).mount('#app');