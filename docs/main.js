/**
 * @typedef {object} MonstersJson monster.json自体の型定義.
 * @prop {Monster[]} monsters モンスターの情報一覧.
 */

/**
 * @typedef {object} Monster モンスターの情報.
 * @prop {string} id 図鑑番号.
 * @prop {string} dicId MONST DICTIONARY（旧：XFLAG DICTIONARY）の図鑑番号.
 * @prop {string} relation 一番大元の進化形態のキャラクターの図鑑番号.
 * @prop {string} shortName モンスター名略称.(一番大元の進化形態のもののモンスター名と一致する.）
 * @prop {string} gacha 排出されるガチャ名.
 * @prop {'火'|'水'|'木'|'光'|'闇'} element モンスターの属性.
 * @prop {string} form 進化形態名.
 * @prop {string} formIdx 進化形態名.
 * @prop {string} from 登場日（yyyy/MM/dd形式）.
 */

/**
 * @typedef {object} VueMonster モンスターの情報.
 * @prop {string} id 図鑑番号.
 * @prop {string} relation 一番大元の進化形態のキャラクターの図鑑番号.
 * @prop {boolean} isFirstForm 図鑑番号.
 * @prop {boolean} isLastForm 図鑑番号.
 * @prop {string} png 図鑑番号.
 * @prop {string} webp 図鑑番号.
 * @prop {string} dic 図鑑番号.
 * @prop {string} shortName モンスター名略称.(一番大元の進化形態のもののモンスター名と一致する.）
 * @prop {string} formName 排出されるガチャ名.
 * @prop {string} gachaName 排出されるガチャ名.
 * @prop {string} elementName モンスターの属性.
 * @prop {string} elementBgStyle モンスターの属性.
 * @prop {string} year 進化形態名.
 * @prop {string} fromDate 登場日（yyyy/MM/dd形式）.
 */

const { createApp, ref, reactive, computed } = Vue;

const ELEMENT_LIST = [
  '火属性',
  '水属性',
  '木属性',
  '光属性',
  '闇属性'
];

// const MONSTER_JSON_URL = 'monsters.json';
// const MONST_DIC_CHARACTER_URL_FORMAT = 'https://dic.xflag.com/monsterstrike/character/{id}/';
// const MONST_DIC_BALL_ICON_URL_FORMAT = 'https://dic.xflag.com/monsterstrike/assets-update/img/monster/{id}/ball.{ext}';
// const MONST_DIC_CHARACTER_ICON_URL_FORMAT = 'https://dic.xflag.com/monsterstrike/assets-update/img/monster/{id}/character.{ext}';

async function getLimitedGachaInfo() {
  const res = await fetch('monsters.json');

  /** @type {MonstersJson} */
  const monstersJson = await res.json();
  
  /** @type {string[]} */
  const gachaList = [];
  /** @type {string[]} */
  const firstFormIdList = [];

  monstersJson.monsters.sort((a, b) => parseInt(a.id) - parseInt(b.id));

  /** @type {{string: Monster[]}} */
  const groupedByRelation = _.groupBy(
    monstersJson.monsters,
    /** @param {Monster} monster */
    (monster) => monster.relation);
  /** @type {VueMonster[]} */
  const monsters = _.map(
    monstersJson.monsters,
    /** @param {Monster} monster */
    (monster) => {
      if (gachaList.indexOf(monster.gacha) == -1) {
        gachaList.push(monster.gacha);
      }
      const formIdx = parseInt(monster.formIdx, 10);
      const isFirstForm = monster.id === monster.relation;
      if (isFirstForm && firstFormIdList.indexOf(monster.id) == -1) {
        firstFormIdList.push(monster.id);
      }
      const _rels = groupedByRelation[monster.relation];
      if (_rels) {
        _rels.sort((a, b) => {
          const aIdx = parseInt(a.formIdx, 10);
          const bIdx = parseInt(b.formIdx, 10);
          return (bIdx - (bIdx % 10)) - (aIdx - (aIdx % 10));
        });
      }
      const latestFormIdx = parseInt(_rels[0].formIdx, 10);

      const from = new Date(monster.from);

      return {
        id: monster.id,
        relation: monster.relation,
        isFirstForm: isFirstForm,
        isLastForm: (latestFormIdx - (latestFormIdx % 10)) === (formIdx - (formIdx % 10)),
        png: `https://dic.xflag.com/monsterstrike/assets-update/img/monster/${monster.dicId}/ball.png`,
        webp: `https://dic.xflag.com/monsterstrike/assets-update/img/monster/${monster.dicId}/ball.webp`,
        url: `https://dic.xflag.com/monsterstrike/character/${monster.dicId}/`,
        shortName: monster.shortName,
        formName: monster.form,
        formFullName: monster.form + (formIdx % 10 != 0 ? (formIdx % 10).toString() : ''),
        gacha: monster.gacha,
        element: `${monster.element}属性`,
        year: `${from.getFullYear()}`,
        fromDate: `${from.getFullYear()}/${from.getMonth() + 1}/${from.getDate()}`
      }
    }
  );

  return {
    gachaList,
    monsters
  };
}

createApp({
  setup() {
    const monsters = ref([]);
    const gachas = ref([]);
    const elements = ref(ELEMENT_LIST);
    const selectedElements = ref(ELEMENT_LIST);
    const selectedGacha = ref('全てのガチャ');
    const formFilterList = ref(['全て表示', '進化前のみ', '獣神化', '獣神化・改', '真獣神化']);
    const selectedFormFilter = ref('全て表示');
    const viewSettingList = ref(['グリッド表示', 'リスト表示']);
    const selectedViewSetting = ref('グリッド表示');
    const useElementColorFilter = ref(true);
    const showId = ref(true);
    const onlyLatestForm = ref(false);
    const iconSize = ref('75');

    (async function() {

      const info = await getLimitedGachaInfo();

      monsters.value = info.monsters;
      gachas.value = info.gachaList;
    }());

    function calcMonstersGroupByYears() {
      return _.groupBy(
        _.filter(monsters.value, (monster) => {
          if (selectedGacha.value !== '全てのガチャ' && monster.gacha !== selectedGacha.value) {
            return false;
          }
          if (onlyLatestForm.value && !monster.isLastForm) {
            return false;
          }
          if (selectedFormFilter.value !== '全て表示') {
            if (selectedFormFilter.value === '進化前のみ' && !monster.isFirstForm) {
              return false;
            }
            if (selectedFormFilter.value === '獣神化' && monster.formName !== '獣神化') {
              return false;
            }
            if (selectedFormFilter.value === '獣神化・改' && monster.formName !== '獣神化・改') {
              return false;
            }
            if (selectedFormFilter.value === '真獣神化' && monster.formName !== '真獣神化') {
              return false;
            }
          }
          if (selectedElements.value.indexOf(monster.element) === -1) {
            return false;
          }
          return true;
        }),
        (monster) => monster.year);
    }

    function onClickCheckAllElements() {
      selectedElements.value = ELEMENT_LIST;
    }

    return {
      monsters,
      calcMonstersGroupByYears,
      gachas,
      selectedGacha,
      formFilterList,
      selectedFormFilter,
      elements,
      selectedElements,
      viewSettingList,
      selectedViewSetting,
      useElementColorFilter,
      showId,
      iconSize,
      onlyLatestForm,
      onClickCheckAllElements
    }
  }
}).mount('#app');