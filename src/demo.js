'use strict';
import { Groot } from './groot';
console.log(Groot);

const tvshows = {
    'TV Shows': {
        'Science Fiction': {
            'Battlestar Galactica': {
                'running': '2004 - 2009',
                'summary': '"When an old enemy, the Cylons, resurface and obliterate the 12 colonies, the crew of the aged Galactica protects a small civilian fleet - the last of humanity - as they journey toward the fabled 13th colony of Earth." (IMDB)',
                'genres': [
                    'Sci-Fi',
                    'Drama',
                    'Action'
                ],
                'cast': {
                    'Edward James Olmos': 'Admiral William Adama',
                    'Mary McDonnell': 'President Laura Roslin',
                    'Jamie Bamber': 'Cpt. Lee "Apollo" Adama',
                    'James Callis': 'Dr. Gaius Baltar',
                    'Tricia Helfer': 'Number Six',
                    'Grace Park': 'Lt. Sharon "Boomer" Valerii',
                    'Katee Sackhoff': 'Captain Kara "Starbuck" Thrace'
                },
                'episodes': {
                    'Season 1': [
                        '33',
                        'Water',
                        'Bastille Day',
                        'Act of Contrition',
                        'You Can\'t Go Home Again',
                        'Litmus'
                    ]
                }
            },
            'Farscape': {
                'running': '1999 - 2003',
                'summary': '"Thrown into a distant part of the universe, an Earth astronaut finds himself part of a fugitive alien starship crew." (IMDB)',
                'genres': [
                    'Sci-Fi',
                    'Drama',
                    'Adventure'
                ],
                'cast': {
                    'Ben Browder': 'John Crichton',
                    'Claudia Black': 'Officer Aeryn Sun',
                    'Anthony Simcoe': 'Ka D\'Argo',
                    'Lani John Tupu': 'Captain Bailar Crais',
                    'Jonathan Hardy': 'Dominar Rygel XVI',
                    'Gigi Edgley': 'Chiana',
                    'Wayne Pygram': 'Scorpius',
                    'Virginia Hey': 'Pa\'u Zotoh Zhaan'
                },
                'episodes': {
                    'Season 1': [
                        'Premiere',
                        'Exodus from Genesis',
                        'Back and Back and Back to the Future',
                        'Throne for a Loss',
                        'PK Tech Girl',
                        'Thank God Its Friday Again'
                    ]
                }
            }
        }
    }
};

const isString = function (target) {
    return Object.prototype.toString.call(target) === '[object String]';
};

const isObject = function (target) {
    return Object.prototype.toString.call(target) === '[object Object]';
};

const isArray = function (target) {
    return Object.prototype.toString.call(target) === '[object Array]';
};

/**
 * Building leafs will be a custom process, as the data involved
 *   will look different from case to case. But this is generally
 *   how it can be accomplished, given the data structure tvshows.
 * @param {String} key
 * @param {Object|Array|String} value
 * @param {Leaf|null} parent
 * @returns {Leaf}
 */
const makeLeaf = (key, value, parent = null) => {

    let label = key;

    if (isString(value)) {
        label += `: ${value}`;
    }

    const leaf = parent ?
        parent.branch(label) :
        new Groot.Leaf(label, true);

    if (isArray(value)) {
        value.forEach((childLeafLabel) => {
            leaf.branch(childLeafLabel);
        });
    }

    if (isObject(value)) {
        Object.keys(value).forEach((key) => {
            makeLeaf(key, value[key], leaf);
        });
    }

    return leaf;
};

const rootLeaf = makeLeaf('TV Shows', tvshows['TV Shows']);

document.addEventListener('DOMContentLoaded', function () {
    const htmlElement = document.querySelector('#groot-container');
    const tvshowsTree = window.tvshowsTree = new Groot(htmlElement, rootLeaf);
    Groot.wireTap(tvshowsTree);

    document.addEventListener('click', function () {
        tvshowsTree.closeMenu();
    });

    rootLeaf.expand(true);
    tvshowsTree.render();
});
