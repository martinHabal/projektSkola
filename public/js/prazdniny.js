function skolniPrazdniny() {
    
      // Důvody pro neoducené hodiny s nápovědou
                  const schoolVacations = [
            {
                name: "Pololetní prázdniny",
                fromDay: 29,
                fromMonth: 0,
                toDay: 30,
                toMonth: 0,
            },
            {
                name: "Jarní prázdniny",
                fromDay: 1,
                fromMonth: 2,
                toDay: 7,
                toMonth: 2,
            },
            {
                name: "Velikonoční prázdniny",
                fromDay: 14,
                fromMonth: 3,
                toDay: 15,
                toMonth: 3,
            },
            {
                name: "Letní prázdniny",
                fromDay: 1,
                fromMonth: 6,
                toDay: 31,
                toMonth: 7,
            },
            {
                name: "Podzimní prázdniny",
                fromDay: 27,
                fromMonth: 9,
                toDay: 28,
                toMonth: 9,
            },
            {
                name: "Vánoční prázdniny",
                fromDay: 23,
                fromMonth: 11,
                toDay: 31,
                toMonth: 11,
            },
        ];
                console.log('Data:', schoolVacations);
                return schoolVacations
}