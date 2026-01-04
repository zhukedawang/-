
import { Lesson } from './types';

export const MOCK_LESSONS: Lesson[] = [
  {
    id: 'l1',
    title: '桃花源记',
    author: '陶渊明',
    category: 'middle',
    sentences: [
      { id: 's1', original: '晋太元中，武陵人捕鱼为业。', translation: '东晋太元年间，武陵郡有个以捕鱼为生的人。' },
      { id: 's2', original: '缘溪行，忘路之远近。', translation: '他顺着溪水划船，忘记了路程的远近。' },
      { id: 's3', original: '忽逢桃花林，夹岸数百步，中无杂树，芳草鲜美，落英缤纷。', translation: '忽然遇到一片桃花林，生长在溪水的两岸，长达几百步。中间没有别的树，芳草鲜嫩美丽，落花纷纷。' },
      { id: 's4', original: '渔人甚异之，复前行，欲穷其林。', translation: '渔人对此感到非常诧异。他又向前划去，想走到那片林子的尽头。' },
      { id: 's5', original: '林尽水源，便得一山，山有小口，仿佛若有光。', translation: '桃林的尽头就是溪水的发源地，在那儿便看到一座山。山上有个小洞口，洞里隐隐约约透出光亮。' }
    ]
  },
  {
    id: 'l2',
    title: '爱莲说',
    author: '周敦颐',
    category: 'middle',
    sentences: [
      { id: 's2-1', original: '水陆草木之花，可爱者甚蕃。', translation: '水上、陆地上各种草木的花，值得喜爱的非常多。' },
      { id: 's2-2', original: '晋陶渊明独爱菊。', translation: '东晋陶渊明只喜爱菊花。' },
      { id: 's2-3', original: '自李唐来，世人甚爱牡丹。', translation: '自唐朝以来，世人非常喜爱牡丹。' }
    ]
  },
  {
    id: 'e1',
    title: 'The Great Gatsby (Excerpt)',
    author: 'F. Scott Fitzgerald',
    category: 'english',
    sentences: [
      { id: 'e1-1', original: 'In my younger and more vulnerable years my father gave me some advice...', translation: '在我年纪还轻、阅历尚浅的那些年里，父亲给我了一些忠告...' },
      { id: 'e1-2', original: '"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."', translation: '“每逢你想要批评任何人的时候，”他对我说，“你就记住，这个世界上所有的人，并不是个个都有你拥有的那些优越条件的。”' }
    ]
  }
];

export const DAYS_OF_WEEK = ['日', '一', '二', '三', '四', '五', '六'];
