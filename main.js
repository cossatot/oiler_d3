(function () {
    'use strict';

    const WIDTH = 1000;
    const HEIGHT = 1000;

    var projection = d3["geoOrthographic"]()
        .precision(0.05)
        .rotate([-88.5, -34, 0])
        .scale(500)
        .translate([500, 500])
        ;

    let sphere = { type: "Sphere" };
    let graticule = d3.geoGraticule10()

    var canvas = d3.select("canvas"),
        width = canvas.property("width"),
        height = canvas.property("height"),
        context = canvas.node().getContext("2d");

    var timeSlider = document.getElementById('time_slider')
    console.log(timeSlider)
    var timeVal = document.getElementById('time_val')

    var path = d3.geoPath()
        .projection(projection)
        .context(context);



    function attachEventListeners() {
        let drawBlocksButton = document.getElementById('draw-blocks')
        drawBlocksButton.addEventListener('click', drawBlocks)

        //timeSlider.addEventListener('change', draw)
    }


    function drawBlocks() {
        let blocks_path = "./chn_blocks_simp.geojson"
        let poles_path = "./block_poles_eur_rel.csv"

        Promise.all([
            d3.json(blocks_path),
            d3.csv(poles_path)
        ]).then(
            function (data) {
                data[0].features.forEach(function (d, i) {
                    d.geometry.coordinates.forEach(function (ring) {
                        ring.reverse();
                    });
                });
                //drawChart(geodata, poles);
                drawChart(data[0], data[1])
            });
    };


    function drawChart(geodata, poles) {

        function render(geodata) {
            context.clearRect(0, 0, WIDTH, HEIGHT);
            context.globalAlpha = 0.5;
            context.beginPath(), path(sphere), context.fillStyle = "#fff", context.fill();
            context.beginPath(), path(graticule), context.strokeStyle = "#ccc", context.stroke();
            context.beginPath(), path(sphere), context.stroke();

            var pole_dict = poles.reduce(function (obj, x) {
                obj[x.mov] = x;
                return obj;
            }, {});

            if (timeVal.value == "") {
                var rot_time = 0.
            } else {
                var rot_time = parseFloat(timeVal.value)
            }

            let t0 = performance.now()
            let rotated_geodata = rotate_blocks(geodata, pole_dict, rot_time)
            let t1 = performance.now()
            let rotate_time = t1 - t0
            // console.log(`rotating blocks took ${rotate_time} ms`)

            let t2 = performance.now()
            rotated_geodata.features.forEach(function (d, i) {
                context.beginPath(), path(d), context.fillStyle = d.properties.color, context.fill();
                context.beginPath(), path(d), context.strokeStyle = d.properties.color, context.stroke();
            });
            let t3 = performance.now()
            let plot_time = t3 - t2
            // console.log(`plotting stuff took ${plot_time} ms`)
        }

        return d3.select(context.canvas)
            .call(zoom(projection)
                .on("zoom.render", () => render(geodata))
            )
            .call(() => render(geodata))
            .node();
    }


    function zoom(projection) {
        let v0, r0, q0;

        function zoomstarted() {
            v0 = versor.cartesian(projection.invert(d3.mouse(this)));
            r0 = projection.rotate();
            q0 = versor(r0);
        }

        function zoomed() {
            projection.scale(d3.event.transform.k * (height - 10) / 2);

            var v1 = versor.cartesian(projection.rotate(r0).invert(d3.mouse(this))),
                q1 = versor.multiply(q0, versor.delta(v0, v1)),
                r1 = versor.rotation(q1);
            projection.rotate(r1);
        }

        return d3.zoom()
            .on("start", zoomstarted)
            .on("zoom", zoomed)
    }


    attachEventListeners();
})();
