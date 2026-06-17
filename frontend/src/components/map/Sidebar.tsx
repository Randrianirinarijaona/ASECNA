import {useState} from 'react';
import {ChevronLeft} from 'lucide-react';
import type {Airport} from '../../types';
import './Sidebar.css';

interface SidebarProps{
 isOpen:boolean;
 airport?:Airport;
 onClose:()=>void;
}

export default function Sidebar({
 isOpen,
 airport,
 onClose
}:SidebarProps){

 const [

 openSection,

 setOpenSection

 ]=useState('');

 if(!isOpen){

 return null;

 }

 const toggle=(section:string)=>{

 if(openSection===section){

 setOpenSection('');

 }

 else{

 setOpenSection(section);

 }

 };

 return(

<div className="map-sidebar open">

<button

className="sidebar-toggle"

onClick={onClose}

>

<ChevronLeft size={20}/>

</button>

<div className="sidebar-content">

<h2>

{airport?.name}

</h2>

<p>

{airport?.iata}

</p>

{/* SFA */}

<button

className="section-btn"

onClick={()=>

toggle('sfa')

}

>

SFA

</button>

{

openSection==='sfa'

&&

<div className="submenu">

<p>AMHS/RSFTA</p>

<p>SMT</p>

<p>ATSDS</p>

<p>AIDC</p>

</div>

}

{/* SMA */}

<button

className="section-btn"

onClick={()=>

toggle('sma')

}

>

SMA

</button>

{

openSection==='sma'

&&

<div className="submenu">

<p>VHF</p>

<p>HF</p>

<p>CPDLC</p>

</div>

}

{/* SRNA */}

<button

className="section-btn"

onClick={()=>

toggle('srna')

}

>

SRNA

</button>

{

openSection==='srna'

&&

<div className="submenu">

<p>Réseau</p>

<p>Antenne</p>

<p>Radiobalise</p>

<p>Radioborne</p>

</div>

}

</div>

</div>

);

}