class City {
    constructor(department, province, district, name, latitude, longitude) {
      this.department = department;
      this.province = province;
      this.district = district;
      this.name = name;
      this.latitude = parseFloat(latitude);
      this.longitude = parseFloat(longitude);
    }
    coordinate() {
        return [this.latitude, this.longitude]
    }
    json_coordinate() {
        return [this.longitude, this.latitude]
    }
    toJson(){
        let json = {
            "type": "Feature",
            "properties": {
                "Name" : this.name,
                "Department" : this.department,
                "Province" : this.province,
                "District" : this.district
            },
            "geometry": {
                "type": "Point",
                "coordinates": [this.longitude, this.latitude]
            }
        }
        return json;
    }
}
const harversineDistance = (a, b) => {
    let dif_latitude = (a.latitude - b.latitude)* (Math.PI/180.0)
    let dif_longitude = (a.longitude - b.longitude)* (Math.PI/180.0)
    let a_latitude = a.latitude * (Math.PI/180.0)
    let b_latitude = b.latitude * (Math.PI/180.0)
    let first = Math.pow(Math.sin(dif_latitude / 2), 2) +
                Math.pow(Math.sin(dif_longitude / 2), 2) *
                Math.cos(a_latitude) * Math.cos(b_latitude);
    let second = 2* Math.asin(Math.sqrt(first))
    return 6371 * second
}
class Edge{
    constructor(a, b, distance) {
        this.a = a;
        this.b = b;
        this.distance = distance;
    }
    toJson(){
        let json = {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    this.a.json_coordinate(), this.b.json_coordinate()
                 ]
            }
        }
        return json;
    }
}
class Graph{
    constructor(){
        this.cities = []
        this.edges = []
    }
    swapCities(i, j)
    {
        const aux = this.cities[i]
        this.cities[i] = this.cities[j]
        this.cities[j] = aux
    }
    getDistance(a, b)
    {
        for(let i = 0; i < this.edges.length; i++)
        {
            if(a.name === this.edges[i].a.name && b.name === this.edges[i].b.name)
            {
                return this.edges[i].distance
            }
        }
    }
    getData(){
        return new Promise((resolve, reject) =>{
            Papa.parse('./src/complejidad.csv', {
                download: true,
                header: true,
                complete: (results) =>{
                     resolve(results.data);
                },
                error: (err) => {
                    reject(err)
                }
            })
        })
    }
    chargeCities(data){
        for(let i = 0; i < data.length; i++){
            this.cities.push(
                new City(data[i].department, data[i].province,
                    data[i].district, data[i].name, data[i].latitude,
                    data[i].longitude
                )
            );
        }
    }
    chargeEdges() {
        if(this.cities.length > 0)
        {
            for(let i = 0; i < this.cities.length; i++)
            {
                for(let j = 0; j < this.cities.length; j++)
                {
                    if(i == j)
                        continue;
                    let distance = harversineDistance(this.cities[i], this.cities[j]);
                    this.edges.push(
                        new Edge(this.cities[i], this.cities[j], distance)
                    )
                }   
            }
        }
    }
    addEdge(a, b){
        this.edges.push(
            new Edge(a, b, harversineDistance(a, b))
        )
    }
    getEdge(a, b){
        for(let i = 0; i < this.edges.length; i++)
        {
            if(a.name === this.edges[i].a.name && b.name === this.edges[i].b.name)
            {
                return this.edges[i]
            }
        }
        return null;
    }
    getEdges(a) {
        let neighbors = []
        let edge = null
        for(let i = 0; i < this.cities.length; i++)
        {
            if(this.cities[i] === a) continue;
            edge = this.getEdge(a, this.cities[i])
            if(edge != null)
            {
                neighbors.push(edge)
            }
        }
        return neighbors
    }
    filterDepartment(department)
    {
        department = department.toUpperCase()
        let graph = new Graph()
        for(let i = 0; i < this.cities.length; i++)
        {
            if(this.cities[i].department == department)
            {
                graph.cities.push(this.cities[i])
            }
        }
        return graph      
    }
    filterProvince(province)
    {
        province = province.toUpperCase()
        let graph = new Graph()
        for(let i = 0; i < this.cities.length; i++)
        {
            if(this.cities[i].province == province)
            {
                graph.cities.push(this.cities[i])
            }
        }
        return graph      
    }
    filterDistrict(district)
    {
        district = district.toUpperCase()
        let graph = new Graph()
        for(let i = 0; i < this.cities.length; i++)
        {
            if(this.cities[i].district == district)
            {
                graph.cities.push(this.cities[i])
            }
        }
        return graph      
    }
    toJson() {
        
        let features = []
        for(let i = 0; i < this.cities.length; i++)
        {
             features.push(this.cities[i].toJson())
        }
        for(let i = 0; i < this.edges.length; i++)
        {
            features.push(this.edges[i].toJson())
        }
        let json = {
            "type": "FeatureCollection",
            "features": features
        }
        return JSON.stringify(json);
    }
    toJsonLigth() {
        
        let features = []
        for(let i = 0; i < this.edges.length; i++)
        {
            features.push(this.edges[i].toJson())
        }
        let json = {
            "type": "FeatureCollection",
            "features": features
        }
        return JSON.stringify(json);
    }
    getPath(rpath){
        let path = [];
        for(let i = 0; i < rpath.length - 1; i++)
        {
            path.push(
                this.getEdge(rpath[i], rpath[i + 1])
            )
        }
        path.push(
            this.getEdge(rpath[0], rpath[this.cities.length - 1])
        )
        this.edges = path
    }

}

// const TSP_BACKTRACKING = (graph, length_solution, recorded_distance, result) => {
//     if(length_solution == graph.cities.length - 1)
//     {
//         result = Math.min(
//             result, 
//             recorded_distance + 
//             graph.getDistance(graph.cities[graph.cities.length - 1], graph.cities[0])
//         )
//     }
//     else
//     {
//         for (let i = length_solution + 1; i < graph.cities.length; i++)
// 		{
//             graph.swapCities(length_solution + 1, i)
// 			let new_distance = recorded_distance + graph.getDistance(graph.cities[length_solution], graph.cities[length_solution + 1]);
// 			if (new_distance >= result)
// 			{
// 				continue; 
// 			}
// 			else
// 			{
// 				result = Math.min(result, TSP_BACKTRACKING(graph, length_solution + 1, new_distance, result));
// 			}
//             graph.swapCities(length_solution + 1, i)
// 		}
//     }
//     return result;

// }
const TSP_NEARST_NEIGHBORS = (graph) => 
{
    let min_distance = 0
    for(let i = 0; i < graph.edges.length; i++)
    {
        if(graph.edges[i].distance < graph.edges[min_distance].distance)
        {
            min_distance = i
        }
    }
    let distance = harversineDistance(graph.edges[min_distance].a, graph.edges[min_distance].b)
    let result = [graph.edges[min_distance].a, graph.edges[min_distance].b]
    let current = graph.edges[min_distance].b
    let gaa = graph.edges[min_distance].a
    console.log(current)
    let a = [...graph.cities]
    a.splice(a.indexOf(graph.edges[min_distance].a), 1)
    a.splice(a.indexOf(graph.edges[min_distance].b), 1)
    graph.edges = []
    graph.addEdge(gaa, current)
    while(a.length)
    {
        min_distance = 0
        for(let i = 1; i < a.length; i++)
        {
            if(harversineDistance(current, a[i]) < harversineDistance(current, a[min_distance]))
            {
                min_distance = i
            }
        }
        graph.addEdge(current, a[min_distance])
        console.log(harversineDistance(current, a[min_distance]))
        if(!Number.isNaN(harversineDistance(current, a[min_distance])))
            distance += harversineDistance(current, a[min_distance])
        current = a[min_distance]
        result.push(current)
        a.splice(min_distance, 1)
    }
    graph.addEdge(current, result[0])
    distance += harversineDistance(current, result[0])
    return {result, distance}
}
const main = async () => {
    let filtered_graph = null;
    let graph = new Graph()
    let data = await graph.getData()
    console.log(data)
    graph.chargeCities(data)
    var mymap = L.map('mapid').setView(graph.cities[0].coordinate(),
        5);
    const attribution =
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const tiles = L.tileLayer(tileUrl, { attribution });
      tiles.addTo(mymap);
    let btn_department = document.querySelector('#department-btn');
    let btn_province = document.querySelector('#province-btn');
    let btn_district = document.querySelector('#district-btn');
    let btn_draw = document.querySelector('#draw-btn');
    let btn_ac = document.querySelector('#ac-btn');
    let btn_calculate = document.querySelector('#calculate-btn');
    btn_department.addEventListener("click", () => {
        let text_department = document.querySelector('#department')
        if(text_department.value)
        {
            let upper = text_department.value.toUpperCase() 
            filtered_graph = graph.filterDepartment(upper)
            if(filtered_graph.cities.length == 0)
            {
                alert("Department: " + upper + " not found")
                filtered_graph = null
                text_department.value = ""
            }
            else
            {
                alert("Department " + upper + " found and loaded")
                text_department.value = ""
            }
        }
        else{
            alert("You must put a value")
        }
    })
    btn_province.addEventListener("click", () => {
        let text_province = document.querySelector('#province')
        if(text_province.value)
        {
            let upper = text_province.value.toUpperCase() 
            filtered_graph = graph.filterProvince(upper)
            if(filtered_graph.cities.length == 0)
            {
                alert("Province: " + upper + " not found")
                filtered_graph = null
                text_province.value = ""
            }
            else
            {
                alert("Province " + upper + " found and loaded")
                text_province.value = ""
            }
        }
        else{
            alert("You most put a value")
        }
    })
    btn_district.addEventListener("click", () => {
        let text_district = document.querySelector('#district')
        if(text_district.value)
        {
            let upper = text_district.value.toUpperCase() 
            filtered_graph = graph.filterDistrict(upper)
            if(filtered_graph.cities.length == 0)
            {
                alert("District: " + upper + " not found")
                filtered_graph = null
                text_district.value = ""
            }
            else
            {
                alert("District " + upper + " found and loaded")
                text_district.value = ""
            }
        }
        else{
            alert("You most put a value")
        }
    })
    btn_ac.addEventListener("click", () => {
        filtered_graph = null
        alert("All the country are charged")
    })
    btn_draw.addEventListener("click", () => {
        if(filtered_graph === null)
        {
            alert("You cant draw entire JSON with all the country")
        }
        else
        {
            mymap.remove()
            mymap = L.map('mapid').setView(filtered_graph.cities[0].coordinate(),12);
            const attribution =
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
            const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            const tiles = L.tileLayer(tileUrl, { attribution });
            tiles.addTo(mymap);
            L.geoJSON(JSON.parse(filtered_graph.toJson())).addTo(mymap);
        }
    })
    btn_calculate.addEventListener("click", () => {
        if(filtered_graph === null)
        {
            graph.chargeEdges()
            let r = TSP_NEARST_NEIGHBORS(graph)
            console.log(graph)
            mymap.remove()
            mymap = L.map('mapid').setView(graph.cities[0].coordinate(),5);
            const attribution =
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
            const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            const tiles = L.tileLayer(tileUrl, { attribution });
            tiles.addTo(mymap);
            L.geoJSON(JSON.parse(graph.toJsonLigth())).addTo(mymap);
            let km = document.querySelector('#km')
            km.innerText = ""
            km.innerText = r.distance
            km.innerText += " km"
        }
        else
        {
            filtered_graph.chargeEdges()
            let r = TSP_NEARST_NEIGHBORS(filtered_graph)
            mymap.remove()
            mymap = L.map('mapid').setView(filtered_graph.cities[0].coordinate(),12);
            const attribution =
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
            const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            const tiles = L.tileLayer(tileUrl, { attribution });
            tiles.addTo(mymap);
            L.geoJSON(JSON.parse(filtered_graph.toJson())).addTo(mymap);
            let km = document.querySelector('#km')
            km.innerText = ""
            km.innerText = r.distance
            km.innerText += " km"
        }
    })

}
main()
