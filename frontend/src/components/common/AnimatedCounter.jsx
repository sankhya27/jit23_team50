import { useEffect, useState } from "react";

export default function AnimatedCounter({

    value,
    duration = 800

}) {

    const [count, setCount] = useState(0);

    useEffect(() => {

        let start = 0;

        const end = Number(value) || 0;

        if (end === 0) {

            setCount(0);

            return;

        }

        const increment = end / (duration / 16);

        const timer = setInterval(() => {

            start += increment;

            if (start >= end) {

                setCount(end);

                clearInterval(timer);

            }

            else {

                setCount(Math.floor(start));

            }

        }, 16);

        return () => clearInterval(timer);

    }, [value, duration]);

    return <>{count}</>;

}