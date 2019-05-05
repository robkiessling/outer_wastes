
(function ($) {
    'use strict';

    Game.namespace('Maps').Tiles = {
        graveyard: {
            name: 'Graveyard',
            color: 'grey'
        },
        village: {
            name: 'Village',
            color: 'beige',
            description: "Contains"
        },
        woods: {
            name: 'Woods',
            color: 'green',
            description: "",
            background: 'forest',
            encounters: ['forest_wolves', 'forest_direWolf', 'forest_spiders', 'forest_goblins']
        },
        cave: {
            name: 'Cave',
            color: 'grey'
        },
        lake: {
            name: 'Lake',
            color: 'light-blue'
        },
        chapel: {
            name: "Angel's\nChapel",
            color: 'white'
        },
        darkGrove: {
            name: "Dark\nGrove",
            color: "orange"
        },
        witchsHut: {
            name: "Witch's\nHut",
            color: 'white'
        },
        cursedGlade: {
            name: 'Cursed\nGlade',
            color: 'purple'
        },
        ruins: {
            name: 'Ruins',
            color: 'beige'
        },
        edge: {
            name: "Edge of\nthe Woods",
            color: 'red'
        }
    };

    Game.namespace('Maps').Database = {
        nightvale: {
            name: 'Nightvale',
            startingCoord: [0, 1],
            tileKeys: [
                'gvwwcwGh',
                'wwwddwGG',
                'wwwdddwr',
                'wawllwre'
            ],
            legend: {
                g: 'graveyard',
                v: 'village',
                w: 'woods',
                c: 'cave',
                G: 'cursedGlade',
                h: 'witchsHut',
                d: 'darkGrove',
                r: 'ruins',
                a: 'chapel',
                l: 'lake',
                e: 'edge'
            }
        },


        world: {
            display: [
                '                                                /***\\                                           \\                                                     ',
                '                         ooo                   / /\\  \\/\\     ∩ ∩      ^                          |                                                    ',
                '                       ooOOOoo                  /**\\ /**\\   ∩ ∩ ∩            _    _    ^          \\           ~                                       ',
                '                     /V\\                       /  /\\/****\\         ^        /_\\  /_\\  /|\\          \\                                                  ',
                '                    /  V\\ .,                     /**\\     \\    ^            |_|  |_|  /|\\   ^       |                                                 ',
                '                  (( (_) (_ )                 /\\/    \\/\\   \\  /|\\          _   _   _       /|\\      |                                                 ',
                '                 (` (_ . _ )                 /**\\ /\\ /  \\     /|\\         /_\\ /_\\ /_\\      /|\\      |             ~~                                  ',
                '                 / /\\      \\                /    /**\\                ^    |_| |_| |_|         ^      |                                                ',
                '                / /. \\. /\\  \\ ^               /\\/****\\          ^   /|\\                      /|\\      \\                                               ',
                '               /      ./  \\  \\            /\\ /**\\     \\        /|\\  /|\\        ^          ^  /|\\      |                                               ',
                '                    ^ .         ^        /**\\    \\             /|\\  ^         /|\\        /|\\ /|\\      |                   ~      ~                    ',
                '                      .                 /****\\/\\             ^     /|\\ ^      /|\\        /|\\         /                                                ',
                '                     .                 /   /\\/  \\       ^   /Λ\\    /|\\/|\\     /|\\  ^          __+    |                        ____              ~     ',
                '                    .                     /**\\         /|\\ //Λ\\\\  ^   /|\\ ^       /|\\   ^    ////\\   |                       /    ---___              ',
                '                   .      /\\            /\\    \\  ^     /|\\ /|Λ|\\ /|\\ ^   /|\\  ^   ^|\\  /|\\   |__||   |                      /           \\___ __       ',
                '                  .      /VV\\         /\\**\\    _/|\\^        |||  ^|\\/|\\  /|\\ /|\\ /|\\\\  /|\\           |                     /   /--)            \\__    ',
                '                  .     /VVVV\\       /**\\  \\  /_\\|/|\\^        ^ /|\\ /|\\  /|\\^/|\\ /|\\  ^              |                     (__/   |    __/\\    ___)   ',
                '                  .                 /**/\\\\    | |^/|/|\\      /|\\/|\\   ^    /|\\   /|\\ /|\\            /         ~~                  /    \\      (       ',
                '         ^        .                /  /**\\      /|\\ /|\\      /|\\     /|\\   /|\\       /|\\           /                           __/  \\    /    _)      ',
                '        / \\       .             /\\ /\\/****\\     /|\\                  /|\\                           |                          /     \\       __)       ',
                '       /   \\      .            /**\\  \\     \\                                              ///      |                          |     /      /          ',
                '                  .           /    /\\~\\                          /                                 |                          /    _______/           ',
                '                   .         //\\  /**\\~                                  //        //              |                         |   _/                   ',
                '                   .     /\\  /**\\/    \\~~             //      ///                           _      \\              ~          (__/                     ',
                '                    .   /**\\/    \\      ~~                                  //             /_\\     \\   __                                             ',
                '           /\\       .  /   /  /\\  \\ /\\   ~~~~~~~~                  // /                    |_| ___ |   )_)                                            ',
                '      /\\  /**\\ /\\    .    /  /**\\  \\            ~~~~~~~~                          //      _   /_/J\\| __ ! __   _                                      ',
                '  /\\ /**\\/****/**\\   .   /   /\\  \\                    ~~~~~~~~~~~~~~~~~                  /_\\  | | || \\_____/  )_)                                 ~   ',
                ' /**\\****\\  /\\     |~ .   |~   \\                                      ~~~~~~~~~~~    __  |_|        ========__ ! __                     ~~            ',
                '/    \\ /\\  /  /\\  /_\\ .  /_\\    \\          _                       .            ~~~~/=/\\            ========\\_____/                                   ',
                '   /\\ /**\\   /**\\ |_|####|_|            .-\' \'-..                   _.---.__   *    |=| ~~~~~~~~~~~~~           ~                                      ',
                '  /_*\\    \\ /    \\                                             .   \\    _.-)                     ~~~ ~                                                ',
                '\\//M\\_\\                     .--\'"  "-..                             \\__/    _-_____        .      / ~                                                 ',
                ' \\MMMM\\\\          __                __                          *   __     (  .    )_            /                                                    ',
                '  \\          .--\'"  "-..       .--\'"  "-..                   .     (_ (  *  )   *    (   **      |                                                    ',
                '                                                               _ .   \\_)     (___)___ )         /                                                     ',
                '                    .--\'"  "-..                          *    ( \\__  .                         |                                                      ',
                ' ..--,,.        __                                         .   )   )       ____________       /                                                       ',
                '            ..-\'  \'\'--.                                    __ (_  (   .   / __.---.__  /     /                                                        ',
                '                                                          (  )  ) |      / / /   /I / //    )                                                         ',
                '    /\\-----------------------/\\                        *   ) ( (__)     / /_I[__]I_/ //     |       ~                                                 ',
                '    \\/-----------------------\\/                           /   \\    .   /  I__/=/__I //      \\                                                         ',
                '    {                         }                           \\..  )      /_____/=/____//   *   \\                                                         ',
                '     }   MAP OF THE WORLD    {                               \\/  .    I____/=/____I/          |                                                       ',
                '    {                         }                        .        ___       /=/           .     \\                                                       ',
                '     }          N            {                            /\\   ( . \\  .  _       .           _)                                                       ',
                '    {         W(@)E           }                                 \\_  \\   ) (__  *         ___/                                                         ',
                '     }          S            {                            *       \\_)    \\_ \\           /                                                             ',
                '    /\\-----------------------/\\                              /\\            (_)        _/                                                              ',
                '    \\/-----------------------\\/                                    .                 /                                                                '
            ]
        }

    };

}(jQuery));

