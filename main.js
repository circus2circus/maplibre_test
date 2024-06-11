const map = new maplibregl.Map({
    container: 'map',
    center: [135.712609, 34.960068], // 京都市南区
    zoom: 12, // ズームレベル
    style: {
        // スタイル仕様のバージョン番号。8を指定する
        version: 8,
        // データソース
        sources: {
            // OpenStreetMap
            'osm-tile': {
                // ソースの種類。vector、raster、raster-dem、geojson、image、video のいずれか
                type: 'raster',
                // タイルソースのURL
                tiles: ['https://tile.openstreetmap.jp/styles/osm-bright-ja/{z}/{x}/{y}.png'],
                // タイルの解像度。単位はピクセル、デフォルトは512
                tileSize: 256,
                // データの帰属
                attribution: "地図の出典：<a href='https://www.openstreetmap.org/copyright' target='_blank'>© OpenStreetMap contributors</a>",
            },      // OpenStreetMap（ベクタタイル）
            'osm-vector-tile': {
                type: 'vector',
                url: 'https://tile.openstreetmap.jp/data/planet.json',
            },

            // 京都市内AEDデータ
            'spot-point': {
                type: 'geojson',
                // GeoJSONファイルのURL
                data: './data/AED.geojson',
                attribution:
                    "データの出典：<a href='https://data.city.kyoto.lg.jp/resource/?id=20052' target='_blank'>京都市オープンデータポータルサイト</a>",
            },
            // 京都府の緊急輸送路データ
            'river-line': {
                type: 'geojson',
                data: './data/Kyoto_kinkyu.geojson',
                attribution: "データの出典：<a href='https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N10-2020.html' target='_blank'>国土交通省国土数値情報ダウンロードサイト</a>",
            },
            // 京都市下京区の法務省登記所備付地図データ
            'moj-polygon': {
                type: 'geojson',
                data: './data/26106__6_r_2023.geojson',
                attribution:
                    "データの出典：<a href='https://www.geospatial.jp/ckan/organization/moj-mapdata' target='_blank'>「登記所備付データ」（法務省）</a>をもとにG空間情報センターにて変換処理したデータを加工して作成",
            },

        },

        // 表示するレイヤ
        layers: [
            // 背景地図としてOpenStreetMapのラスタタイルを追加
            {
                // 一意のレイヤID
                id: 'osm-layer',
                // レイヤの種類。background、fill、line、symbol、raster、circle、fill-extrusion、heatmap、hillshade のいずれか
                type: 'raster',
                // データソースの指定
                source: 'osm-tile',
            },      // 京都市下京区の法務省登記所備付地図のポリゴンデータを追加
            {
                id: 'polygon-layer',
                type: 'fill',
                source: 'moj-polygon',
                paint: {
                    // 塗りつぶしの色
                    'fill-color': '#fd7e00',
                    // 塗りつぶしの透明度。0になるほど透明に、1になるほど不透明になる
                    'fill-opacity': 0.3,
                    // 枠の色
                    'fill-outline-color': '#ff0000',
                },
            },
            // 京都市内AEDのポイントデータを追加
            {
                id: 'point-layer',
                type: 'circle',
                source: 'spot-point',
                paint: {
                    // 丸の半径。単位はピクセル。
                    'circle-radius': 5,
                    // 丸の色
                    //'circle-color': '#3887be',
                    'circle-color': '#ff0000',
                },
            },
            // 京都府の緊急輸送路のラインデータを追加
            {
                id: 'line-layer',
                type: 'line',
                source: 'river-line',
                paint: {
                    // ラインの色
                    //'line-color': '#ade0ee',
                    'line-color': '#00008b',
                    // ラインの幅
                    'line-width': 5,
                },
                // 地物の条件式を指定
                // フィルターなし
                //filter: ['!=', 'W05_004', '名称不明'],
            },
            // OpenStreetMapの3D建物を追加
            {
                id: 'building-3d-layer',
                // 3Dポリゴン
                type: 'fill-extrusion',
                source: 'osm-vector-tile',
                // ベクタタイルソースから使用するレイヤ
                'source-layer': 'building',
                // hide_3dプロパティがない地物を抽出
                filter: ['all', ['!has', 'hide_3d']],
                paint: {
                    // 高さ
                    'fill-extrusion-height': {
                        type: 'identity',
                        property: 'render_height',
                    },
                    // ベースの高さ
                    'fill-extrusion-base': {
                        type: 'identity',
                        property: 'render_min_height',
                    },
                    // 透明度
                    'fill-extrusion-opacity': 0.6,
                    // 塗りつぶしの色
                    // 地物の色を取得できる場合はその色を使う、ない場合は既定の色を使う
                    'fill-extrusion-color': ['case', ['has', 'colour'], ['get', 'colour'], '#C0C0C0'],
                },
            },
        ],
    },
});
// ポイントクリック時にポップアップを表示する
map.on('click', 'point-layer', function (e) {
    var coordinates = e.features[0].geometry.coordinates.slice();
    //var name = e.features[0].properties.施設名称;
    var name = e.features[0].properties.施設名;

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }
    // ポップアップを表示する
    new maplibregl.Popup({
        offset: 10, // ポップアップの位置
        closeButton: false, // 閉じるボタンの表示
    })
        .setLngLat(coordinates)
        .setHTML(name)
        .addTo(map);
}); map.on('click', 'polygon-layer', function (e) {
    // note: 今回使うデータは小字名がすべてnullだったので住所に含めていない
    //var address = e.features[0].properties.市町村名 + e.features[0].properties.大字名 + e.features[0].properties.丁目名 + e.features[0].properties.地番;
    var address = e.features[0].properties.市町村名 + e.features[0].properties.大字名 + e.features[0].properties.地番;
    new maplibregl.Popup({
        offset: 10,
        closeButton: false,
    })
        .setLngLat(e.lngLat)
        .setHTML(address)
        .addTo(map);
});