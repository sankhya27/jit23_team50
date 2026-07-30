export default function ThreatMeter({ level }) {

    const levels = {

        LOW: 25,
        MEDIUM: 50,
        HIGH: 75,
        CRITICAL: 100

    };

    return (

        <div className="threat-meter">

            <div className="threat-title">

                Threat Level

                <span className={`meter-text ${level.toLowerCase()}`}>

                    {level}

                </span>

            </div>

            <div className="meter-track">

                <div
                    className={`meter-fill ${level.toLowerCase()}`}
                    style={{
                        width: `${levels[level]}%`
                    }}
                />

            </div>

        </div>

    );

}