type EquipmentType = {
    id: string;
    description: string;
    searchClass: string[];
}

interface Test {
    [key: string]: EquipmentType;
}

export const equipmentType: Test = {
    "AC": {
        "id": "AC",
        "description": "Auto Carrier",
        "searchClass": ["O"]
    },
    "BT": {
        "id": "BT",
        "description": "B-Train",
        "searchClass": ["F", "K"]
    },
    "BJ": {
        "id": "",
        "description": "Auto Carrier",
        "searchClass": ["O"]
    },
}

const equip =  {
    AC: { id: 'AC', description: 'Auto Carrier', searchClass: [ 'O' ] },
    BT: { id: 'BT', description: 'B-Train', searchClass: [ 'F', 'K' ] },
    CN: { id: 'CN', description: 'Conestoga', searchClass: [ 'N' ] },
    C:  { id: 'C', description: 'Container', searchClass: [ 'C' ] },
    CI: { id: 'C', description: 'Container Insulated', searchClass: [ 'CI', 'C' ]},
    CV: { id: 'CV', description: 'Conveyor', searchClass: [ 'O' ] },
    DD: { id: 'DD', description: 'Double Drop', searchClass: [ 'D', 'K' ] },
    LA: { id: 'LA', description: 'Drop Deck Landoll', searchClass: [ 'K' ] },
    DT: { id: 'DT', description: 'Dump Trailer', searchClass: [ 'K' ] },
    FA: { id: 'FA', description: 'Flatbed Air-Ride', searchClass: [ 'F' ] },
    FN: { id: 'FN', description: 'Flatbed Conestoga', searchClass: [ 'N' ] },
    FZ: { id: 'FZ', description: 'Flatbed HazMat', searchClass: [ 'Z' ] },
    FH: { id: 'FH', description: 'Flatbed Hotshot', searchClass: [ 'K' ] },
    MX: { id: 'MX', description: 'Flatbed Maxi', searchClass: [ 'F', 'K' ] },
    FD: { id: 'FD', description: 'Flatbed or Step Deck', searchClass: [ 'D', 'F' ] },
    FO: { id: 'FO', description: 'Flatbed Overdimension', searchClass: [ 'F' ]},
    FC: { id: 'FC', description: 'Flatbed w/Chains', searchClass: [ 'F' ] },
    FS: { id: 'FS', description: 'Flatbed w/Sides', searchClass: [ 'F' ] },
    FM: { id: 'FM', description: 'Flatbed w/Team', searchClass: [ 'F' ] },
    FR: { id: 'FR', description: 'Flatbed/Van/Reefer', searchClass: [ 'F', 'R', 'V' ] },
    HB: { id: 'HB', description: 'Hopper Bottom', searchClass: [ 'B' ] },
    IR: { id: 'IR', description: 'Insulated Van or Reefer', searchClass: [ 'R', 'S', 'V' ] },
    LB: { id: 'LB', description: 'Lowboy', searchClass: [ 'K' ] },
    LR: { id: 'LR', description: 'Lowboy or Rem Gooseneck (RGN)', searchClass: [ 'K' ]},
    LO: { id: 'LO', description: 'Lowboy Overdimension', searchClass: [ 'K' ]},
    NU: { id: 'NU', description: 'Pneumatic', searchClass: [ 'B' ] },
    PO: { id: 'PO', description: 'Power Only', searchClass: [ 'O' ] },
    R: { id: 'R', description: 'Reefer', searchClass: [ 'R' ] },
    RA: { id: 'RA', description: 'Reefer Air-Ride', searchClass: [ 'R' ] },
    R2: { id: 'R2', description: 'Reefer Double', searchClass: [ 'R' ] },
    RZ: { id: 'RZ', description: 'Reefer HazMat', searchClass: [ 'Z' ] },
    RN: { id: 'RN', description: 'Reefer Intermodal', searchClass: [ 'R' ] },
    RV: { id: 'RV', description: 'Reefer or Vented Van', searchClass: [ 'R', 'S', 'V' ] },
    RP: { id: 'RP', description: 'Reefer Pallet Exchange', searchClass: ["R"]},
    RM: { id: 'RM', description: 'Reefer w/Team', searchClass: 'R' },
    RG: { id: 'RG', description: 'Removable Gooseneck', searchClass: [ 'K' ] },
    SD: { id: 'SD', description: 'Step Deck', searchClass: [ 'D' ] },
    SR: { id: 'SR', description: 'Step Deck or Rem Gooseneck (RGN)', searchClass: [ 'K', 'D' ]},
    SN: { id: 'SN', description: 'Stepdeck Conestoga', searchClass: [ 'N' ] },
    ST: { id: 'ST', description: 'Stretch Trailer', searchClass: [ 'K' ] },
    TA: { id: 'TA', description: 'Tanker Aluminum', searchClass: [ 'T' ] },
    TN: { id: 'TN', description: 'Tanker Intermodal', searchClass: [ 'T' ] },
    TS: { id: 'TS', description: 'Tanker Steel', searchClass: [ 'T' ] },
    TT: { id: 'TT', description: 'Truck and Trailer', searchClass: [ 'F', 'K' ]},
    V: { id: 'V', description: 'Van', searchClass: [ 'V' ] },
    VA: { id: 'VA', description: 'Van Air-Ride', searchClass: [ 'V' ] },
    VS: { id: 'VS', description: 'Van Conestoga', searchClass: [ 'V' ] },
    V2: { id: 'V2', description: 'Van Double', searchClass: [ 'S', 'V' ] },
    VZ: { id: 'VZ', description: 'Van HazMat', searchClass: [ 'Z' ] },
    VH: { id: 'VH', description: 'Van Hotshot', searchClass: [ 'S' ] },
    VI: { id: 'VI', description: 'Van Insulated', searchClass: [ 'S', 'V' ] },
    VN: { id: 'VN', description: 'Van Intermodal',searchClass: [ 'R', 'V' ]},
    VG: { id: 'VG', description: 'Van Lift-Gate', searchClass: [ 'V' ] },
    OT: { id: 'OT', description: 'Van Open-Top', searchClass: [ 'S' ] },
    VF: { id: 'VF', description: 'Van or Flatbed', searchClass: [ 'F', 'V' ]},
    VT: { id: 'VT', description: 'Van or Flatbed w/Tarps',searchClass: [ 'F', 'V' ]},
    VR: { id: 'VR', description: 'Van or Reefer', searchClass: [ 'R', 'V' ] },
    VP: { id: 'VP', description: 'Van Pallet Exchange', searchClass: [ 'V' ]},
    VB: { id: 'VB', description: 'Van Roller Bed', searchClass: [ 'S' ] },
    V3: { id: 'V3', description: 'Van Triple', searchClass: [ 'S', 'V' ] },
    VC: { id: 'VC', description: 'Van w/Curtains', searchClass: [ 'S', 'V' ]},
    VM: { id: 'VM', description: 'Van w/Team', searchClass: [ 'S', 'V' ] }
  }
  