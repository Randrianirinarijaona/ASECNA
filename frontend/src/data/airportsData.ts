//airportsData.ts
import type { Airport } from '../types';

export const AIRPORTS: Record<string, Airport> = {
  "TNR": {
    name: "Ivato",
    iata: "TNR",
    coords: [-18.8787, 47.5079],
    sections: {
        sfa: [
            { 
                title: "AMHS/RSFTA", 
                description: "Système de messagerie AFTN/AMHS",
                details: ["Serveur principal opérationnel", "Redondance active", "Taux de disponibilité : 99.8%"],
                status: "maintenance"
            },
            { 
                title: "SMT", 
                description: "Système de Messagerie Terminale",
                details: ["Version 2.3 installée"],
                status: "operational"
            }
        ],
        sma: [
            { 
                title: "VHF", 
                description: "Communications VHF",
                details: ["Couverture 100% dans le TMA", "5 fréquences opérationnelles"],
                status: "operational"
            },
            { 
                title: "HF", 
                description: "Communications Haute Fréquence",
                details: ["Antennes en bon état"],
                status: "maintenance"
            }
        ],
        srna: [
            { 
                title: "Réseau", 
                description: "Réseau de transmission",
                details: ["Fibre optique principale", "Liaison satellite backup"],
                status: "operational"
            }
        ]
    },  
  },

  "DIE": {
    name: "Toamasina",
    iata: "DIE",
    coords: [-18.1089697984752, 49.39269376622393],
    sections: {
        sfa: [
            { 
                title: "AMHS/RSFTA", 
                description: "Système de messagerie AFTN/AMHS",
                details: ["Serveur principal opérationnel", "Redondance active", "Taux de disponibilité : 99.8%"],
                status: "operational"
            },
            { 
                title: "SMT", 
                description: "Système de Messagerie Terminale",
                details: ["Version 2.3 installée"],
                status: "operational"
            }
        ],
        sma: [
            { 
                title: "VHF", 
                description: "Communications VHF",
                details: ["Couverture 100% dans le TMA", "5 fréquences opérationnelles"],
                status: "operational"
            },
            { 
                title: "HF", 
                description: "Communications Haute Fréquence",
                details: ["Antennes en bon état"],
                status: "maintenance"
            }
        ],
        srna: [
            { 
                title: "Réseau", 
                description: "Réseau de transmission",
                details: ["Fibre optique principale", "Liaison satellite backup"],
                status: "operational"
            }
        ]
    },
    },

    "MJG": {
    name: "Mahajanga",
    iata: "MJG",
    coords: [-15.666954850137442, 46.35106480662277],
    sections: {
        sfa: [
            { 
                title: "AMHS/RSFTA", 
                description: "Système de messagerie AFTN/AMHS",
                details: ["Serveur principal opérationnel", "Redondance active", "Taux de disponibilité : 99.8%"],
                status: "operational"
            },
            { 
                title: "SMT", 
                description: "Système de Messagerie Terminale",
                details: ["Version 2.3 installée"],
                status: "operational"
            }
        ],
        sma: [
            { 
                title: "VHF", 
                description: "Communications VHF",
                details: ["Couverture 100% dans le TMA", "5 fréquences opérationnelles"],
                status: "operational"
            },
            { 
                title: "HF", 
                description: "Communications Haute Fréquence",
                details: ["Antennes en bon état"],
                status: "maintenance"
            }
        ],
        srna: [
            { 
                title: "Réseau", 
                description: "Réseau de transmission",
                details: ["Fibre optique principale", "Liaison satellite backup"],
                status: "operational"
            }
        ]
    },
    },
    
    
    "Fort Dauphin": {
    name: "Tolagnaro",
    iata: "Fort Dauphin",
    coords: [-25.03644107410689, 46.95447113950406],
    sections: {
        sfa: [
            { 
                title: "AMHS/RSFTA", 
                description: "Système de messagerie AFTN/AMHS",
                details: ["Serveur principal opérationnel", "Redondance active", "Taux de disponibilité : 99.8%"],
                status: "operational"
            },
        ],
        sma: [
            { 
                title: "VHF", 
                description: "Communications VHF",
                details: ["Couverture 100% dans le TMA", "5 fréquences opérationnelles"],
                status: "operational"
            },
            
        ],
        srna: [
            { 
                title: "Réseau", 
                description: "Réseau de transmission",
                details: ["Fibre optique principale", "Liaison satellite backup"],
                status: "operational"
            }
        ]
    },
    },
}
