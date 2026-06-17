import {

 Marker,

 Popup

} from 'react-leaflet';

import type {

 Airport

} from '../../types';

interface Props{

 airport:Airport;

 onClick:()=>void;

 isSelected?:boolean;

}

export default function AirportMarker({

 airport,

 onClick

}:Props){

 return(

<Marker

 position={airport.coords}

>

<Popup>

<div>

<h3>

{airport.name}

</h3>

<p>

{airport.iata}

</p>

<button

onClick={onClick}

>

National

</button>

</div>

</Popup>

</Marker>

);

}