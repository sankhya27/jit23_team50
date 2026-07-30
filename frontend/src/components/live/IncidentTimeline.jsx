import { useEffect, useState } from "react";

const API = "http://localhost:5001/api";

export default function IncidentTimeline() {

    const [incidents,setIncidents]=useState([]);

    useEffect(()=>{

        load();

        const timer=setInterval(load,3000);

        return()=>clearInterval(timer);

    },[]);

    async function load(){

        try{

            const token=localStorage.getItem("token");

            const res=await fetch(

                `${API}/incidents`,

                {

                    headers:{

                        Authorization:`Bearer ${token}`

                    }

                }

            );

            const data=await res.json();

            setIncidents(

                (data.incidents || [])

            );

        }

        catch(err){

            console.log(err);

        }

    }

    function color(level){

        switch(level){

            case "critical":

                return "#ef4444";

            case "high":

                return "#f97316";

            case "medium":

                return "#eab308";

            default:

                return "#22c55e";

        }

    }

    return(

        <div className="chart-card">

            <h3>

                🕒 Incident Timeline

            </h3>

            {

                incidents.length===0 ?

                <p>No incidents yet.</p>

                :

                incidents.map(item=>(

                    <div

                        className="timeline-item"

                        key={item._id}

                    >

                        <div

                            className="timeline-dot"

                            style={{

                                background:color(item.severity)

                            }}

                        />

                        <div className="timeline-info">

                            <strong>

                                {item.attackType}

                            </strong>

                            <span>

                                {item.severity.toUpperCase()}

                            </span>

                        </div>

                        <small>

                            {

                                new Date(

                                    item.createdAt

                                ).toLocaleTimeString()

                            }

                        </small>

                    </div>

                ))

            }

        </div>

    );

}