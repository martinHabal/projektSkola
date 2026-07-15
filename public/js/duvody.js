function duvodyNepritomnosti() {
    
      // Důvody pro neoducené hodiny s nápovědou
                const missedReasons = [
                    {
                        id: "vacation",
                        name: "Dovolená",
                        hint: "Plánovaná dovolená - čerpání řádné dovolené podle zákoníku práce"
                    },
                    {
                        id: "substitute_leave",
                        name: "Náhradní volno",
                        hint: "Náhradní volno za práci o svátcích, víkendech nebo přesčas"
                    },
                    {
                        id: "self_study",
                        name: "Samostudium",
                        hint: "Čas věnovaný samostudiu, přípravě na výuku nebo dalšímu vzdělávání"
                    },
                    {
                        id: "business_trip",
                        name: "Služební cesta",
                        hint: "Cesta vykonávaná v zájmu zaměstnavatele mimo obvyklé pracoviště"
                    },
                    {
                        id: "school_event",
                        name: "Akce školy",
                        hint: "Školní akce jako exkurze, výlety, soutěže, třídní schůzky apod."
                    },
                    {
                        id: "sick_leave",
                        name: "Neschopenka",
                        hint: "Nemoc nebo úraz potvrzený lékařem - pracovní neschopnost"
                    },
                    {
                        id: "paragraph",
                        name: "Paragraf",
                        hint: "Volno podle § 115 Zákoníku práce (kratší pracovní doba apod.)"
                    },
                    {
                        id: "doctor",
                        name: "Lékař",
                        hint: "Návštěva lékaře, preventivní prohlídky, vyšetření"
                    },
                    {
                        id: "unpaid_leave",
                        name: "Neplacené volno",
                        hint: "Volno bez nároku na mzdu - osobní důvody"
                    },
                    {
                        id: "other",
                        name: "Ostatní důvody",
                        hint: "Jiný důvod neodpovídající výše uvedeným kategorií"
                    }
                ];
                console.log('Data:', missedReasons);
                return missedReasons
}