
(function ($) {
    'use strict';

    Game.namespace('Levels').Backgrounds = {
        forest: {
            height: 2,
            doodads: { t: 'tree' },
            layout: [
                '          .                      ,-,                                                    .                  .                         ',
                '                                ( (             .                  .                                                               . ',
                '                                 `-`                                                                  .                              ',
                ' .                 .                                                                           .                                     ',
                '                                       .                                     .                                       .               ',
                '                                                                                                                                     ',
                '------------------------------------------------------------------------------------------------------------------------------------*',
                '                                                                                                                                     ',
                '                                                                                                                                     ',
                '               t                                                                                                       t             ',
                '        t                             t                           t                                t                                 ',
                '                    t                                    t                      t      t                                        t    ',
                't                            t            t                               t                                     t                    '
            ]
        }
    };

    Game.namespace('Levels').Doodads = {
        tree: {
            name: 'tree',
            image: [
                '    ^    ',
                '   /^\\   ',
                '  ,|/\\`  ',
                '  ,/,|`  ',
                ' /,|,``\\ ',
                ', /,^|\'\\`',
                '/ /|`\\ `\\',
                '   | |   ',
                '  / , \\  '
            ],
            colors: [
                '    g    ',
                '   ggg   ',
                '  gbggg  ',
                '  gggbg  ',
                ' ggbgggg ',
                'g gggbggg',
                'g gbgg gg',
                '   b b   ',
                '  b b b  '
            ]
        }

    };


    Game.namespace('Levels').Centerpieces = {
        battle: {
            image: [
                ' _                 _',
                ' \\`.             .\'/',
                '  `.`.         .\'.\'',
                '    `.`.     .\'.\'',
                '      `.`. .\'.\'',
                '        `.`.\'',
                '  |\\   .\'.`.`.   /|',
                '  `.`-\'.\'   `.`-\'.\'',
                '   .\\;\'\\_   _/`:/.',
                '_.\\;\' \'-\'   `-\' `:/._',
                '\\;\'               `:/'
            ]
        },
        one: {
            image: [
                '                     ',
                '                     ',
                '        ,;;;.        ',
                '       // |||        ',
                '          |||        ',
                '          |||        ',
                '          |||        ',
                '          |||        ',
                '       ,,;/.\\__,     ',
                '       `````````     ',
                '                     '
            ]
        },
        two: {
            image: [
                '                     ',
                '                     ',
                '        ,;;;,        ',
                '       //   \\\\       ',
                '       ``    ))      ',
                '            //       ',
                '           //        ',
                '          //         ',
                '       ,,;/.___,     ',
                '       `````````     ',
                '                     '
            ]
        },
        three: {
            image: [
                '                     ',
                '                     ',
                '        ,;;;,        ',
                '       //   \\\\       ',
                '       ``    ))      ',
                '        ,,;;//       ',
                '         ```\\\\       ',
                '       ,,    ))      ',
                '       \\\\   //       ',
                '        `\'\'\'\'        ',
                '                     '
            ]
        }
    };


}(jQuery));