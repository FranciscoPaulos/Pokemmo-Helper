import { makeRouteKey } from "../lib/normalizeLocation";
import { assetPath } from "../lib/assetPath";

export interface RouteConnections {
  north?: RouteConnection;
  east?: RouteConnection;
  west?: RouteConnection;
  south?: RouteConnection;
}

export type RouteConnection = string | RouteConnectionInfo;

export interface RouteConnectionInfo {
  label: string;
  targetRouteName?: string;
}

export interface RouteMapInfo {
  routeKey: string;
  regionName: string;
  routeName: string;
  connections: RouteConnections;
  imageUrl?: string;
  animatedImageUrl?: string;
  imageAlt?: string;
  sourceUrl?: string;
  notes?: string;
  hasMapImage?: boolean;
}

type RouteMapInput = [regionName: string, routeName: string, connections: RouteConnections, extras?: Partial<RouteMapInfo>];
type Direction = keyof RouteConnections;

const oppositeDirection: Record<Direction, Direction> = {
  north: "south",
  east: "west",
  west: "east",
  south: "north"
};

function routeMap([regionName, routeName, connections, extras = {}]: RouteMapInput): RouteMapInfo {
  return {
    routeKey: makeRouteKey(regionName, routeName),
    regionName,
    routeName,
    connections,
    ...extras
  };
}

const kantoRoutes: RouteMapInput[] = [
  [
    "Kanto",
    "Route 1",
    { north: "Viridian City", south: "Pallet Town" },
    { imageUrl: assetPath("route-maps/kanto-route-1.png"), imageAlt: "Location of Route 1 in Kanto" }
  ],
  ["Kanto", "Route 2", { north: "Pewter City", east: "Diglett's Cave", south: "Viridian City" }],
  ["Kanto", "Route 3", { east: "Mt. Moon", west: "Pewter City" }],
  ["Kanto", "Route 4", { east: "Route 4 East", west: "Route 4 West" }],
  [
    "Kanto",
    "Route 4 West",
    { east: "Mt. Moon", west: "Route 3" },
    {
      imageUrl: assetPath("route-maps/kanto-route-4.png"),
      animatedImageUrl: assetPath("route-maps-animated/kanto-route-4.png")
    }
  ],
  [
    "Kanto",
    "Route 4 East",
    { east: "Cerulean City", west: "Mt. Moon" },
    {
      imageUrl: assetPath("route-maps/kanto-route-4.png"),
      animatedImageUrl: assetPath("route-maps-animated/kanto-route-4.png")
    }
  ],
  ["Kanto", "Route 5", { north: "Cerulean City", south: "Saffron City" }],
  ["Kanto", "Route 6", { north: "Saffron City", south: "Vermilion City" }],
  ["Kanto", "Route 7", { east: "Saffron City", west: "Celadon City" }],
  ["Kanto", "Route 8", { east: "Lavender Town", west: "Saffron City" }],
  ["Kanto", "Route 9", { east: "Route 10", west: "Cerulean City" }],
  ["Kanto", "Route 10", { north: "Route 9", south: "Lavender Town" }],
  ["Kanto", "Route 11", { north: "Diglett's Cave", east: "Route 12", west: "Vermilion City" }],
  ["Kanto", "Route 12", { north: "Lavender Town", west: "Route 11", south: "Route 13" }],
  ["Kanto", "Route 13", { east: "Route 12", west: "Route 14" }],
  ["Kanto", "Route 14", { north: "Route 13", south: "Route 15" }],
  ["Kanto", "Route 15", { east: "Route 14", west: "Fuchsia City" }],
  ["Kanto", "Route 16", { east: "Celadon City", west: "Route 17" }],
  ["Kanto", "Route 17", { north: "Route 16", south: "Route 18" }],
  ["Kanto", "Route 18", { east: "Fuchsia City", west: "Route 17" }],
  ["Kanto", "Route 19", { north: "Fuchsia City", south: "Route 20" }],
  ["Kanto", "Route 20", { east: "Route 19", west: "Cinnabar Island" }],
  ["Kanto", "Route 21", { north: "Pallet Town", south: "Cinnabar Island" }],
  ["Kanto", "Route 22", { east: "Viridian City", west: "Pokemon League Reception Gate" }],
  ["Kanto", "Route 23", { north: "Pokemon League Reception Gate", south: "Indigo Plateau" }],
  ["Kanto", "Route 24", { north: "Route 25", south: "Cerulean City" }],
  ["Kanto", "Route 25", { east: "Sea Cottage", west: "Route 24" }],
  ["Kanto", "Viridian Forest", { north: "Route 2", south: "Route 2" }],
  ["Kanto", "Diglett's Cave", { north: "Route 2", south: "Route 11" }],
  [
    "Kanto",
    "Mt. Moon",
    {
      east: { label: "Route 4 East", targetRouteName: "Route 4 East" },
      west: { label: "Route 4 West", targetRouteName: "Route 4 West" }
    }
  ],
  ["Kanto", "Rock Tunnel", { north: "Route 10", south: "Route 10" }],
  ["Kanto", "Seafoam Islands", { east: "Route 20", west: "Route 20" }],
  ["Kanto", "Treasure Beach", { north: "One Island" }],
  ["Kanto", "Kindle Road", { north: "Mt. Ember", west: "One Island" }],
  ["Kanto", "Cape Brink", { south: "Two Island" }],
  ["Kanto", "Bond Bridge", { east: "Three Island", west: "Berry Forest" }],
  ["Kanto", "Three Isle Port", { north: "Three Island", west: "Three Isle Path" }],
  ["Kanto", "Three Isle Path", { east: "Three Isle Path", west: "Three Isle Path" }],
  ["Kanto", "Resort Gorgeous", { east: "Lost Cave", west: "Water Labyrinth" }],
  ["Kanto", "Water Labyrinth", { north: "Resort Gorgeous", south: "Five Island" }],
  ["Kanto", "Five Isle Meadow", { west: "Five Island", south: "Memorial Pillar" }],
  ["Kanto", "Memorial Pillar", { north: "Five Isle Meadow" }],
  ["Kanto", "Outcast Island", { north: "Altering Cave", south: "Green Path" }],
  ["Kanto", "Green Path", { north: "Outcast Island", east: "Water Path" }],
  ["Kanto", "Water Path", { north: "Green Path", west: "Six Island", south: "Ruin Valley" }],
  ["Kanto", "Ruin Valley", { north: "Water Path" }],
  ["Kanto", "Trainer Tower", { south: "Seven Island" }],
  ["Kanto", "Canyon Entrance", { north: "Seven Island" }],
  ["Kanto", "Sevault Canyon", { west: "Canyon Entrance", south: "Tanoby Ruins" }],
  ["Kanto", "Tanoby Ruins", { north: "Sevault Canyon" }]
];

const johtoRoutes: RouteMapInput[] = [
  ["Johto", "Route 29", { north: "Route 46", east: "New Bark Town", west: "Cherrygrove City" }],
  ["Johto", "Route 30", { north: "Route 31", south: "Cherrygrove City" }],
  ["Johto", "Route 31", { north: "Dark Cave", east: "Route 30", west: "Violet City" }],
  ["Johto", "Route 32", { north: "Violet City", east: "Ruins of Alph", south: "Union Cave" }],
  ["Johto", "Route 33", { east: "Union Cave", west: "Azalea Town" }],
  ["Johto", "Route 34", { north: "Goldenrod City", south: "Ilex Forest" }],
  ["Johto", "Route 35", { north: "National Park", south: "Goldenrod City" }],
  ["Johto", "Route 36", { north: "Route 37", east: "Violet City", west: "National Park", south: "Ruins of Alph" }],
  ["Johto", "Route 37", { north: "Ecruteak City", south: "Route 36" }],
  ["Johto", "Route 38", { east: "Ecruteak City", west: "Route 39" }],
  ["Johto", "Route 39", { north: "Route 38", south: "Olivine City" }],
  ["Johto", "Route 40", { north: "Olivine City", south: "Route 41" }],
  ["Johto", "Route 41", { east: "Route 40", west: "Cianwood City" }],
  ["Johto", "Route 42", { north: "Mt. Mortar", east: "Mahogany Town", west: "Ecruteak City" }],
  ["Johto", "Route 43", { north: "Lake of Rage", south: "Mahogany Town" }],
  ["Johto", "Route 44", { east: "Ice Path", west: "Mahogany Town" }],
  ["Johto", "Route 45", { north: "Blackthorn City", south: "Route 46" }],
  ["Johto", "Route 46", { north: "Route 45", south: "Route 29" }],
  ["Johto", "Route 47", { north: "Route 48", east: "Cliff Edge Gate" }],
  ["Johto", "Route 48", { north: "Johto Safari Zone", south: "Route 47" }],
  ["Johto", "Dark Cave", { north: "Route 45", east: "Route 46", south: "Route 31" }],
  ["Johto", "Union Cave", { north: "Route 32", south: "Route 33" }],
  ["Johto", "Ilex Forest", { north: "Route 34", east: "Azalea Town" }],
  ["Johto", "Cliff Edge Gate", { east: "Cianwood City", west: "Route 47" }],
  ["Johto", "Ice Path", { east: "Blackthorn City", west: "Route 44" }]
];

const hoennRoutes: RouteMapInput[] = [
  ["Hoenn", "Route 101", { north: "Oldale Town", south: "Littleroot Town" }],
  ["Hoenn", "Route 102", { east: "Oldale Town", west: "Petalburg City" }],
  ["Hoenn", "Route 103", { east: "Route 110", south: "Oldale Town" }],
  ["Hoenn", "Route 104", { north: "Rustboro City", east: "Petalburg City", south: "Route 105" }],
  ["Hoenn", "Route 105", { north: "Route 104", south: "Route 106" }],
  ["Hoenn", "Route 106", { north: "Route 105", south: "Dewford Town" }],
  ["Hoenn", "Route 107", { east: "Route 108", west: "Dewford Town" }],
  ["Hoenn", "Route 108", { east: "Route 109", west: "Route 107" }],
  ["Hoenn", "Route 109", { north: "Slateport City", west: "Route 108" }],
  ["Hoenn", "Route 110", { north: "Mauville City", east: "Route 103", south: "Slateport City" }],
  ["Hoenn", "Route 111", { north: "Route 113", west: "Route 112", south: "Mauville City" }],
  ["Hoenn", "Route 112", { east: "Route 111", west: "Lavaridge Town" }],
  ["Hoenn", "Route 113", { east: "Route 111", west: "Fallarbor Town" }],
  ["Hoenn", "Route 114", { east: "Fallarbor Town", south: "Meteor Falls" }],
  ["Hoenn", "Route 115", { north: "Meteor Falls", south: "Rustboro City" }],
  ["Hoenn", "Route 116", { east: "Rusturf Tunnel", west: "Rustboro City" }],
  ["Hoenn", "Route 117", { east: "Mauville City", west: "Verdanturf Town" }],
  ["Hoenn", "Route 118", { north: "Route 119", east: "Route 123", west: "Mauville City" }],
  ["Hoenn", "Route 119", { north: "Fortree City", south: "Route 118" }],
  ["Hoenn", "Route 120", { north: "Fortree City", south: "Route 121" }],
  ["Hoenn", "Route 121", { north: "Route 120", east: "Lilycove City", south: "Route 122" }],
  ["Hoenn", "Route 122", { north: "Route 121", south: "Route 123" }],
  ["Hoenn", "Route 123", { north: "Route 122", west: "Route 118" }],
  ["Hoenn", "Route 124", { east: "Mossdeep City", west: "Lilycove City", south: "Route 126" }],
  ["Hoenn", "Route 125", { north: "Shoal Cave", south: "Mossdeep City" }],
  ["Hoenn", "Route 126", { north: "Route 124", east: "Route 127" }],
  ["Hoenn", "Route 127", { north: "Mossdeep City", west: "Route 126", south: "Route 128" }],
  ["Hoenn", "Route 128", { north: "Route 127", east: "Ever Grande City", south: "Route 129" }],
  ["Hoenn", "Route 129", { north: "Route 128", west: "Route 130" }],
  ["Hoenn", "Route 130", { east: "Route 129", west: "Route 131" }],
  ["Hoenn", "Route 131", { east: "Route 130", west: "Pacifidlog Town" }],
  ["Hoenn", "Route 132", { east: "Pacifidlog Town", west: "Route 133" }],
  ["Hoenn", "Route 133", { east: "Route 132", west: "Route 134" }],
  ["Hoenn", "Route 134", { east: "Route 133", west: "Slateport City" }],
  ["Hoenn", "Petalburg Woods", { north: "Route 104", south: "Route 104" }],
  ["Hoenn", "Rusturf Tunnel", { east: "Verdanturf Town", west: "Route 116" }],
  ["Hoenn", "Fiery Path", { north: "Route 112", south: "Route 112" }],
  ["Hoenn", "Jagged Pass", { north: "Mt. Chimney", south: "Route 112" }],
  ["Hoenn", "Meteor Falls", { east: "Route 114", west: "Route 115" }]
];

const sinnohRoutes: RouteMapInput[] = [
  ["Sinnoh", "Route 201", { east: "Sandgem Town", west: "Verity Lakefront", south: "Twinleaf Town" }],
  ["Sinnoh", "Route 202", { north: "Jubilife City", south: "Sandgem Town" }],
  ["Sinnoh", "Route 203", { east: "Oreburgh Gate", west: "Jubilife City" }],
  ["Sinnoh", "Route 204", { north: "Floaroma Town", south: "Jubilife City" }],
  ["Sinnoh", "Route 205", { north: "Eterna Forest", east: "Eterna City", west: "Floaroma Town" }],
  ["Sinnoh", "Route 206", { north: "Eterna City", south: "Route 207" }],
  ["Sinnoh", "Route 207", { north: "Route 206", east: "Mount Coronet", south: "Oreburgh City" }],
  ["Sinnoh", "Route 208", { east: "Hearthome City", west: "Mount Coronet" }],
  ["Sinnoh", "Route 209", { north: "Solaceon Town", west: "Hearthome City" }],
  ["Sinnoh", "Route 210", { east: "Route 215", west: "Celestic Town", south: "Solaceon Town" }],
  ["Sinnoh", "Route 211", { north: "Mount Coronet", east: "Celestic Town", west: "Eterna City", south: "Mount Coronet" }],
  ["Sinnoh", "Route 212", { north: "Hearthome City", east: "Pastoria City" }],
  ["Sinnoh", "Route 213", { north: "Valor Lakefront", west: "Pastoria City" }],
  ["Sinnoh", "Route 214", { north: "Veilstone City", east: "Spring Path", west: "Maniac Tunnel", south: "Valor Lakefront" }],
  ["Sinnoh", "Route 215", { east: "Veilstone City", west: "Route 210" }],
  ["Sinnoh", "Route 216", { north: "Route 217", east: "Mount Coronet" }],
  ["Sinnoh", "Route 217", { north: "Acuity Lakefront", south: "Route 216" }],
  ["Sinnoh", "Route 218", { east: "Jubilife City", west: "Canalave City" }],
  ["Sinnoh", "Route 219", { north: "Sandgem Town", south: "Route 220" }],
  ["Sinnoh", "Route 220", { north: "Route 219", east: "Route 221" }],
  ["Sinnoh", "Route 221", { north: "Pal Park", west: "Route 220" }],
  ["Sinnoh", "Route 222", { east: "Sunyshore City", west: "Valor Lakefront" }],
  ["Sinnoh", "Route 223", { north: "Pokemon League", south: "Sunyshore City" }],
  ["Sinnoh", "Route 224", { north: "Seabreak Path", west: "Victory Road" }],
  ["Sinnoh", "Route 225", { east: "Survival Area", south: "Fight Area" }],
  ["Sinnoh", "Route 226", { north: "Route 227", east: "Route 228", west: "Survival Area" }],
  ["Sinnoh", "Route 227", { north: "Stark Mountain", south: "Route 226" }],
  ["Sinnoh", "Route 228", { west: "Route 226", south: "Route 229" }],
  ["Sinnoh", "Route 229", { north: "Route 228", west: "Route 230", south: "Resort Area" }],
  ["Sinnoh", "Route 230", { east: "Route 229", west: "Fight Area" }],
  ["Sinnoh", "Verity Lakefront", { north: "Lake Verity", east: "Route 201" }],
  ["Sinnoh", "Oreburgh Gate", { east: "Route 203", west: "Oreburgh City" }],
  ["Sinnoh", "Ravaged Path", { north: "Route 204", south: "Route 204" }],
  ["Sinnoh", "Eterna Forest", { east: "Route 205", south: "Route 205" }],
  ["Sinnoh", "Mount Coronet", { north: "Route 216", east: "Route 208", west: "Route 207" }],
  ["Sinnoh", "Valor Lakefront", { north: "Route 214", east: "Route 222", west: "Lake Valor", south: "Route 213" }],
  ["Sinnoh", "Acuity Lakefront", { north: "Lake Acuity", east: "Snowpoint City", south: "Route 217" }],
  ["Sinnoh", "Spring Path", { east: "Sendoff Spring", west: "Route 214" }],
  ["Sinnoh", "Seabreak Path", { north: "Flower Paradise", south: "Route 224" }]
];

const unovaRoutes: RouteMapInput[] = [
  ["Unova", "Route 1", { north: "Accumula Town", west: "Route 17", south: "Nuvema Town" }],
  ["Unova", "Route 2", { north: "Striaton City", east: "Accumula Town" }],
  ["Unova", "Route 3", { west: "Nacrene City", south: "Striaton City" }],
  ["Unova", "Route 4", { north: "Nimbasa City", west: "Desert Resort", south: "Castelia City" }],
  ["Unova", "Route 5", { east: "Nimbasa City", west: "Driftveil Drawbridge" }],
  ["Unova", "Route 6", { north: "Chargestone Cave", east: "Driftveil City" }],
  ["Unova", "Route 7", { north: "Twist Mountain", south: "Mistralton City" }],
  ["Unova", "Route 8", { north: "Moor of Icirrus", east: "Tubeline Bridge", west: "Icirrus City" }],
  ["Unova", "Route 9", { east: "Opelucid City", west: "Tubeline Bridge", south: "Challenger's Cave" }],
  ["Unova", "Route 10", { north: "Victory Road", west: "Opelucid City" }],
  ["Unova", "Route 11", { east: "Village Bridge", west: "Opelucid City" }],
  ["Unova", "Route 12", { east: "Lacunosa Town", west: "Village Bridge" }],
  ["Unova", "Route 13", { north: "Giant Chasm", west: "Lacunosa Town", south: "Undella Town" }],
  ["Unova", "Route 14", { north: "Undella Town", west: "Abundant Shrine", south: "Black City / White Forest" }],
  ["Unova", "Route 15", { east: "White Forest", west: "Marvelous Bridge" }],
  ["Unova", "Route 16", { north: "Lostlorn Forest", east: "Marvelous Bridge", west: "Nimbasa City" }],
  ["Unova", "Route 17", { east: "Route 1", west: "Route 18" }],
  ["Unova", "Route 18", { east: "Route 17" }],
  ["Unova", "Route 19", { east: "Floccesy Town", south: "Aspertia City" }],
  ["Unova", "Route 20", { north: "Floccesy Ranch", east: "Virbank City", west: "Floccesy Town" }],
  ["Unova", "Route 21", { north: "Humilau City", south: "Seaside Cave" }],
  ["Unova", "Route 22", { east: "Humilau City", west: "Giant Chasm" }],
  ["Unova", "Route 23", { east: "Giant Chasm", west: "Victory Road" }],
  ["Unova", "Black City / White Forest", { north: "Route 14", east: "Route 15" }, { hasMapImage: false }],
  ["Unova", "Chargestone Cave", { north: "Mistralton City", south: "Route 6" }],
  ["Unova", "Driftveil Drawbridge", { east: "Route 5", west: "Driftveil City" }],
  ["Unova", "Marvelous Bridge", { east: "Route 15", west: "Route 16" }],
  ["Unova", "Pinwheel Forest", { north: "Skyarrow Bridge", east: "Nacrene City" }],
  ["Unova", "Skyarrow Bridge", { north: "Castelia City", south: "Pinwheel Forest" }],
  ["Unova", "Tubeline Bridge", { east: "Route 9", west: "Route 8" }],
  ["Unova", "Twist Mountain", { east: "Icirrus City", south: "Route 7" }],
  ["Unova", "Village Bridge", { east: "Route 12", west: "Route 11" }],
  ["Unova", "Giant Chasm", { east: "Route 22", west: "Route 23", south: "Route 13" }],
  ["Unova", "Reversal Mountain", { east: "Undella Town", west: "Lentimas Town" }],
  ["Unova", "Undella Bay", { north: "Seaside Cave", west: "Undella Town" }],
  ["Unova", "Seaside Cave", { north: "Route 21", south: "Undella Bay" }],
  ["Unova", "Marine Tube", { north: "Humilau City", south: "Undella Town" }]
];

const encounterLocationRoutes: RouteMapInput[] = [
  ["Kanto", "Cerulean Cave", { south: "Cerulean City" }],
  ["Kanto", "Dilford Chamber", { north: "Tanoby Ruins" }],
  ["Kanto", "Four Island", { east: "Icefall Cave" }],
  ["Kanto", "Icefall Cave", { west: "Four Island" }],
  ["Kanto", "Liptoo Chamber", { north: "Tanoby Ruins" }],
  ["Kanto", "Monean Chamber", { north: "Tanoby Ruins" }],
  ["Kanto", "Pattern Bush", { south: "Green Path" }],
  ["Kanto", "Pokemon Mansion", { south: "Cinnabar Island" }],
  ["Kanto", "Pokemon Tower", { south: "Lavender Town" }],
  ["Kanto", "Power Plant", { west: "Route 10" }],
  ["Kanto", "Rixy Chamber", { north: "Tanoby Ruins" }],
  ["Kanto", "S.S. Anne", { north: "Vermilion City" }],
  ["Kanto", "Safari Zone", { south: "Fuchsia City" }],
  ["Kanto", "Scufib Chamber", { north: "Tanoby Ruins" }],
  ["Kanto", "Viapois Chamber", { north: "Tanoby Ruins" }],
  ["Kanto", "Victory Road", { north: "Indigo Plateau", south: "Route 23" }],
  ["Kanto", "Weepth Chamber", { north: "Tanoby Ruins" }],

  ["Johto", "Bell Tower", { west: "Ecruteak City" }],
  ["Johto", "Burned Tower", { south: "Ecruteak City" }],
  ["Johto", "Cliff Cave", { east: "Cliff Edge Gate", west: "Route 47" }],
  ["Johto", "Dragon's Den", { south: "Blackthorn City" }],
  ["Johto", "Mount Silver", { east: "Route 28" }],
  ["Johto", "Mount Silver Cave", { south: "Mount Silver" }],
  ["Johto", "Pokéathlon Dome", { south: "National Park" }],
  ["Johto", "Route 26", { north: "Pokemon League Reception Gate", south: "Route 27" }],
  ["Johto", "Route 27", { east: "Route 26", west: "New Bark Town" }],
  ["Johto", "Route 28", { east: "Pokemon League Reception Gate", west: "Mount Silver" }],
  ["Johto", "Safari Zone", { south: "Safari Zone Gate" }],
  ["Johto", "Safari Zone Gate", { north: "Safari Zone", south: "Route 48" }],
  ["Johto", "Slowpoke Well", { west: "Azalea Town" }],
  ["Johto", "Sprout Tower", { south: "Violet City" }],
  ["Johto", "Team Rocket HQ", { south: "Mahogany Town" }],
  ["Johto", "Tohjo Falls", { east: "Route 27", west: "Route 27" }],
  ["Johto", "Victory Road", { north: "Pokemon League Reception Gate", south: "Route 26" }],
  ["Johto", "Whirl Islands", { west: "Route 41" }],

  ["Hoenn", "Abandoned Ship", { west: "Route 108" }],
  ["Hoenn", "Altering Cave", { south: "Battle Frontier" }],
  ["Hoenn", "Aqua Hideout", { west: "Lilycove City" }],
  ["Hoenn", "Artisan Cave", { south: "Battle Frontier" }],
  ["Hoenn", "Battle Frontier", { east: "Artisan Cave", west: "Altering Cave" }],
  ["Hoenn", "Cave Of Origin", { south: "Sootopolis City" }],
  ["Hoenn", "Desert Underpass", { west: "Route 114" }],
  ["Hoenn", "Granite Cave", { south: "Route 106" }],
  ["Hoenn", "Magma Hideout", { south: "Jagged Pass" }],
  ["Hoenn", "Mirage Tower", { south: "Route 111" }],
  ["Hoenn", "Mount Pyre", { west: "Route 122" }],
  ["Hoenn", "New Mauville", { north: "Route 110" }],
  ["Hoenn", "Safari Zone", { south: "Route 121" }],
  ["Hoenn", "Scorched Slab", { south: "Route 120" }],
  ["Hoenn", "Seafloor Cavern", { north: "Route 128" }],
  ["Hoenn", "Sealed Chamber", { north: "Route 134" }],
  ["Hoenn", "Sky Pillar", { south: "Route 131" }],
  ["Hoenn", "Sootopolis City", { north: "Cave Of Origin", east: "Route 126" }],
  ["Hoenn", "Underwater", { north: "Route 124", south: "Route 126" }],
  ["Hoenn", "Victory Road", { south: "Ever Grande City" }],

  ["Sinnoh", "Fuego Ironworks", { south: "Route 205" }],
  ["Sinnoh", "Great Marsh", { north: "Pastoria City" }],
  ["Sinnoh", "Honey Tree", {}, { hasMapImage: false, notes: "Honey tree encounters can occur at multiple trees." }],
  ["Sinnoh", "Iron Island", { south: "Canalave City" }],
  ["Sinnoh", "Old Chateau", { south: "Eterna Forest" }],
  ["Sinnoh", "Oreburgh Mine", { north: "Oreburgh City" }],
  ["Sinnoh", "Ruin Maniac Cave", { west: "Route 214" }],
  ["Sinnoh", "Snowpoint Temple", { south: "Snowpoint City" }],
  ["Sinnoh", "Solaceon Ruins", { west: "Solaceon Town" }],
  ["Sinnoh", "Trophy Garden", { north: "Route 212" }],
  ["Sinnoh", "Turnback Cave", { south: "Spring Path" }],
  ["Sinnoh", "Valley Windworks", { west: "Route 205" }],
  ["Sinnoh", "Wayward Cave", { north: "Route 206" }],

  ["Unova", "Celestial Tower", { south: "Route 7" }],
  ["Unova", "Cold Storage", { north: "Driftveil City" }],
  ["Unova", "Dragonspiral Tower", { south: "Icirrus City" }],
  ["Unova", "Dreamyard", { west: "Striaton City" }],
  ["Unova", "Guidance Chamber", { south: "Mistralton Cave" }],
  ["Unova", "Mistralton Cave", { north: "Guidance Chamber", south: "Route 6" }],
  ["Unova", "P2 Laboratory", { east: "Route 17" }],
  ["Unova", "Relic Castle", { south: "Desert Resort" }],
  ["Unova", "Trial Chamber", { south: "Mistralton Cave" }],
  ["Unova", "Wellspring Cave", { south: "Route 3" }]
];

export function toLocalRouteMapImagePath(regionName: string, routeName: string): string {
  const fileName = `${regionName}-${routeName}`
    .toLowerCase()
    .replace(/['.]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return assetPath(`route-maps/${fileName}.png`);
}

export function toLocalAnimatedRouteMapImagePath(regionName: string, routeName: string): string {
  return toLocalRouteMapImagePath(regionName, routeName).replace("/route-maps/", "/route-maps-animated/");
}

function getConnectionLabel(connection: RouteConnection): string {
  return typeof connection === "string" ? connection : connection.label;
}

function getConnectionTargetRouteName(connection: RouteConnection): string {
  return typeof connection === "string" ? connection : connection.targetRouteName ?? connection.label;
}

function mergeConnection(target: RouteMapInfo, direction: Direction, value: string) {
  if (!target.connections[direction]) {
    target.connections[direction] = value;
  }
}

function buildRouteMaps(entries: RouteMapInput[]): Record<string, RouteMapInfo> {
  const maps: Record<string, RouteMapInfo> = {};

  for (const entry of entries) {
    const route = routeMap(entry);
    maps[route.routeKey] = {
      ...route,
    imageUrl:
      route.hasMapImage === false
        ? undefined
        : route.imageUrl ?? toLocalRouteMapImagePath(route.regionName, route.routeName),
    animatedImageUrl:
      route.hasMapImage === false
        ? undefined
        : route.animatedImageUrl ?? toLocalAnimatedRouteMapImagePath(route.regionName, route.routeName),
    imageAlt: route.imageAlt ?? `Location of ${route.routeName} in ${route.regionName}`
    };
  }

  for (const route of Object.values(maps)) {
    for (const [direction, connection] of Object.entries(route.connections) as Array<[Direction, RouteConnection]>) {
      const connectedLocation = getConnectionTargetRouteName(connection);
      const connectedRouteKey = makeRouteKey(route.regionName, connectedLocation);
      const connectedRoute =
        maps[connectedRouteKey] ??
        {
          routeKey: connectedRouteKey,
          regionName: route.regionName,
          routeName: connectedLocation,
          connections: {},
          imageUrl: toLocalRouteMapImagePath(route.regionName, connectedLocation),
          animatedImageUrl: toLocalAnimatedRouteMapImagePath(route.regionName, connectedLocation),
          imageAlt: `Location of ${connectedLocation} in ${route.regionName}`,
          hasMapImage: true
        };

      mergeConnection(connectedRoute, oppositeDirection[direction], getConnectionLabel(connection) === route.routeName ? route.routeName : route.routeName);
      maps[connectedRouteKey] = connectedRoute;
    }
  }

  return maps;
}

export const routeMapsByRouteKey: Record<string, RouteMapInfo> = buildRouteMaps([
  ...kantoRoutes,
  ...johtoRoutes,
  ...hoennRoutes,
  ...sinnohRoutes,
  ...unovaRoutes,
  ...encounterLocationRoutes
]);
