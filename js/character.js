function Character_Template(params) {
  var char = {
		flavor: { //Core Character Description
	    name: "",
	    trueName: "",
	    race: "",
	    alignment: "",
	    age: 0,
	    lifespan: 0,
	    sex: "",
	    height: "",
	    weight: "",
	    origin: "",
	    environment: "",
	    background: "",
	    hostilities: [],
	    disposition: "",
	    insanity: ""
	  },
		capabilities: {

		},
	  consumables: { //Things that drain.
	    hp: 0,
	    dc: 0,
	    dctype: "",
	    adc: 0,
	    isp: 0,
	    chi: 0,
	    ppe: 0
	  },
	  stats: { //Base Stats.
	    iq: 0,
	    me: 0,
	    ma: 0,
	    ps: 0,
	    pp: 0,
	    pe: 0,
	    pb: 0,
	    spd: 0,
			xp: 0,
			lvl: 1
	  },
	  combat: { //Combat Stats.
	    atk: 0,
	    init: 0,
	    dmg: 0,
	    strike: 0,
	    parry: 0,
	    dodge: 0,
	    roll: 0,
	    pull: "", //string for dice damage e.g. "1d4"
	    punch: "", //string for dice damage e.g. "1d4"
	    power: "",
	    kick: "",
	    leap: "",
	    crit: 20,
	    knockout: 21,
	    death: 22
	  },
	  saves: { //Saving Throws
	    spell: 0,
	    ritual: 0,
	    psionic: 0,
	    poison: 0,
	    drugs: 0,
	    insanity: 0,
	    possession: 0,
	    horror: 0,
	    coma: 0.0,
	    perception: 0
	  },
	  skills: [ //array of skill objects

	  ],
	  proficiencies: [ //array of proficiency objects

	  ],
	  weapons: [ //array of weapon objects

	  ],
	  armors: [ //array of armor objects

	  ],
	  abilities: [ //array of special abilities

	  ]
}
	return $.extend(true, {}, char, params);
}
