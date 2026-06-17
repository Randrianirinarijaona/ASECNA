import { useState } from 'react';
import {MapContainer,TileLayer} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import MapHeader from '../../components/map/MapHeader';
import Sidebar from '../../components/map/Sidebar';
import AirportMarker from '../../components/map/AirportMarker';
import { AIRPORTS } from '../../data/airportsData';
import './MapPage.css';
export default function MapPage() {

 // Aéroport sélectionné
 const [

 selectedAirport,

 setSelectedAirport

 ] = useState<string | null>(null);

 // Ouverture Sidebar National
 const [

 isSidebarOpen,

 setIsSidebarOpen

 ] = useState(false);

 const centerMadagascar:

 [number, number]

 = [-18.7669, 46.8691];

 // Fonction appelée lorsqu'on clique sur National
 const openNational = (

 key: string

 ) => {

 setSelectedAirport(key);

 setIsSidebarOpen(true);

 };

 return (

 <div className="map-page">

 <MapHeader />

 <div className="map-container">

 <Sidebar

 isOpen={isSidebarOpen}

 airport={

 selectedAirport

 ? AIRPORTS[selectedAirport]

 : undefined

 }

 onClose={()=>

 setIsSidebarOpen(false)

 }

 />

 <div className="map-wrapper">

 <MapContainer

 center={centerMadagascar}

 zoom={5}

 style={{

 height:'100%',

 width:'100%'

 }}

 >

 <TileLayer

 attribution='&copy; OpenStreetMap'

 url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

 />

 {

 Object.entries(

 AIRPORTS

 ).map(

 ([key, airport])=>(

 <AirportMarker

 key={key}

 airport={airport}

 // IMPORTANT
 onClick={()=>

 openNational(key)

 }

 isSelected={

 selectedAirport===key

 }

 />

 )

 )

 }

 </MapContainer>

 </div>

 </div>

 </div>

 );

}