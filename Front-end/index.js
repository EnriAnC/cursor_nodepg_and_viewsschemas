const d = document;

const pagination = Pagination();
d.addEventListener('DOMContentLoaded', async e=>{
    const data = await pagination.init();
    drawPaginations();
    imprimir(data)
})

d.addEventListener('change', async e=>{
    await cantidadDeFilasEnTabla(e)
})

d.addEventListener('click', async e=>{
    await nextandpreviouspagination(e)
    if (e.target.dataset.pais) {
        if (!confirm(`¿Estas seguro de eliminar el pais ${e.target.dataset.pais}?`)) return
        const deleteRow = await deletebyName(e.target.dataset.pais)
        if (deleteRow) e.target.parentElement.parentElement.parentElement.removeChild(e.target.parentElement.parentElement)
        
    }
})

d.addEventListener('submit', e=>{
    e.preventDefault()
    if (e.target.matches('#form-post-pais')){
        ingresarPais(e)
    }

})

function drawPaginations(){
    const paginationLinks = d.getElementsByClassName('pagination-links')[0]
    const fragment = d.createDocumentFragment()
    const span = d.createElement('span');
    span.setAttribute('table-page', 'previous')
    span.textContent = '<'
    fragment.append(span.cloneNode(true))
    let i = 1;
    while (i<= +pagination.cantPages){
        span.textContent = i;
        span.setAttribute('table-page', i)
        fragment.append(span.cloneNode(true));
        i++
    }
    span.setAttribute('table-page', 'next')
    span.textContent = '>';
    fragment.append(span.cloneNode(true));
    console.log(fragment)
    paginationLinks.textContent = ''
    paginationLinks.append(fragment)
}


function Pagination(){
    return {
        data:{},
        max:null,
        cantPages:null,
        actualPage:null,
        async getData(tableSQL, cantidadDeFilas, desdeLaFila, filtercolumn, filtertype, getmax){
            const uniqueKey = `${filtercolumn}-${filtertype}-${desdeLaFila}-${cantidadDeFilas}`
            if (this.data[uniqueKey]) return this.data[uniqueKey] 
            const res = await fetch(`http://localhost:3000/${tableSQL}/${cantidadDeFilas}/${desdeLaFila}/${filtercolumn}/${filtertype}/${getmax}`);
            const data = await res.json()
            if (data.rows) {
                this.data[uniqueKey] = data.rows
                this.max = data.max
                this.cantPages = Math.ceil(+this.max/+data.cantFilas)
                this.actualPage = 1
            }
            else this.data[uniqueKey] = data
            return this.data[uniqueKey]
        },
        async init(tableSQL= 'paises', cantidadDeFilas = 5, desdeLaFila = 0, filtercolumn = 'nombre', filtertype = 'asc', getmax = 1){
            const data = await this.getData(tableSQL, cantidadDeFilas, desdeLaFila, filtercolumn, filtertype, getmax)
            // console.log(data)
            return data
        },
        updateCantPages(cantrows){
            this.cantPages = Math.ceil(+this.max/+cantrows)
        }
    }
}

async function cantidadDeFilasEnTabla(e){
    if (!e.target.matches('#cantfilas')) return
    if (e.target.value){
        console.log(e.target.value)
        const data= await pagination.getData('paises', e.target.value, +pagination.actualPage * +e.target.value - +e.target.value, 'nombre', 'asc', 0)
        pagination.updateCantPages(e.target.value)
        console.log(data)
        if (data) imprimir(data)
        drawPaginations()
    }
}

async function nextandpreviouspagination(e){
    if (e.target.getAttribute('table-page')){
        const cantFilas = d.getElementById('cantfilas').value
        const page = e.target.getAttribute('table-page')
        if (!Number(page)) {
            if (page === 'next') pagination.actualPage++
            if (pagination.actualPage <= 0) pagination.actualPage = 1
            if (page === 'previous') pagination.actualPage--
            if (pagination.actualPage > pagination.cantPages) pagination.actualPage = pagination.cantPages  
        } else {
            pagination.actualPage = +page
        }
        pagination.updateCantPages(cantFilas)
        const data= await pagination.getData('paises', cantFilas, +pagination.actualPage * +cantFilas - +cantFilas, 'nombre', 'asc', 0)
        if (data) imprimir(data)
        drawPaginations()
    }
}

async function deletebyName(nombre){
    const res = await fetch('http://localhost:3000/paises/'+nombre, {method:'DELETE'})
    if (!res.ok) return false
    const data = await res.json()
    alert(`${data.msg} a ${data.nombre}`)
    return data
}

const ingresarPais = async (e)=>{
    const body = {
        nombre: e.target.nombre.value,
        continente: e.target.continente.value,
        poblacion: e.target.poblacion.value,
        pib_2019: e.target.pib2019.value,
        pib_2020: e.target.pib2020.value
    }
    const options = {
        method:"POST",
        headers: new Headers({
            "Content-Type":"application/json",
        }),
        body: JSON.stringify(body)
    }
    try {
        const res = await fetch('http://localhost:3000/paises/', options),
        data = await res.json();
        if (!res.ok) throw {code:data.code, msg:data.detail}
        alert("Se ha ingresado correctamente")
        let i = 0;
        while (i<5){
            e.target[i].value = ''
            i++
        }
        if (confirm('Se necesita actualizar la pagina para ver los cambios,\n¿Desea actualizar?')) location.reload()
        return data
    } catch (err) {
        console.log(err)
        alert(`Codigo de error: ${err.code}\n${err.msg}`)
    }   
}


const imprimir = (data) =>{
    const $tbody = d.getElementById('paises-pib');
    $tbody.innerHTML = ''
    const tr = d.createElement('tr')
    data.forEach(pais=>{
        if (pais.rowno) delete pais.rowno
        const tr = d.createElement('tr')
        Object.values(pais).forEach(el=>{
            const td = d.createElement('td')  
            td.innerHTML = el
            tr.append(td)
        })
        const td = d.createElement('td')  
        td.innerHTML = `<button id="eliminar-pais" data-pais=${pais.nombre}>Eliminar</button>`
        tr.append(td)
        $tbody.append(tr)
    })
    $tbody.append(tr)
}

