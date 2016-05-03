var vehicles = {
  BIG_DADDY: 'bigDaddy',
  SCOUT: 'scout',
  FLYER: 'flyer'
};

module.exports = {
  vehicles: vehicles,
  cameras: {
    bdfront: {
      device: '192.168.1.133',
      port: 8001,
      vehicle: vehicles.BIG_DADDY,
      nameReadable: 'Big Daddy Front'
    },
    bdright: {
      device: '192.168.1.121',
      port: 8002,
      vehicle: vehicles.BIG_DADDY,
      nameReadable: 'Big Daddy Right'
    },
    bdback: {
      device: '192.168.1.151',
      port: 8003,
      vehicle: vehicles.BIG_DADDY,
      nameReadable: 'Big Daddy Back'
    },
    bdleft: {
      device: '192.168.1.142',
      port: 8004,
      vehicle: vehicles.BIG_DADDY,
      nameReadable: 'Big Daddy Left'
    },
    arm: {
      device: '192.168.1.201',
      port: 8005,
      vehicle: vehicles.BIG_DADDY,
      nameReadable: 'Arm'
    },
    scout: {
      device: '192.168.1.200',
      port: 8006,
      vehicle: vehicles.SCOUT,
      nameReadable: 'Scout'
    }
  },
  dof: {
    bigDaddy: {
      device: '192.168.1.133',
      port: 3001,
      name: 'bigDaddy'
    },
    scout: {
      device: '192.168.1.200',
      port: 3002,
      name: 'scout'
    },
    flyer: {
      device: '192.168.1.000',
      port: 3003,
      name: 'flyer'
    }
  },
  gps: {
    bigDaddy: {
      device: '192.168.1.133',
      port: 4001,
      name: 'bigDaddy'
    },
    scout: {
      device: '192.168.1.200',
      port: 4002,
      name: 'scout'
    },
    flyer: {
      device: '192.168.1.000',
      port: 4003,
      name: 'flyer'
    }
  }
};
