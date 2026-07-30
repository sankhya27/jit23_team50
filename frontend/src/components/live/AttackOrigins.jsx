import { useEffect, useState } from "react";

const API = "http://localhost:5001/api";

export default function AttackOrigins() {

    const [countries, setCountries] = useState([]);

    useEffect(() => {

        loadCountries();

        const timer = setInterval(loadCountries, 3000);

        return () => clearInterval(timer);

    }, []);

    async function loadCountries() {

        try {

            const token = localStorage.getItem("token");

            const res = await fetch(

                `${API}/analytics/attack-origins`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }

            );

            if (!res.ok)
                return;

            const data = await res.json();

            setCountries(data);

        }

        catch (err) {

            console.log(err);

        }

    }

    return (

        <div className="chart-card">

            <h3>

                🌍 Attack Origins

            </h3>

            {

                countries.length === 0 ?

                <p>No attack origin data available.</p>

                :

                countries.map((item,index)=>(

                    <div
                        key={index}
                        className="country-row"
                    >

                        <div>

                            {item.country}

                        </div>

                        <div className="country-bar">

                            <div
                                className="country-fill"
                                style={{
                                    width: `${item.percentage}%`
                                }}
                            />

                        </div>

                        <strong>

                            {item.count}

                        </strong>

                    </div>

                ))

            }

        </div>

    );

}