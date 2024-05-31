const mapContainer = document.getElementById('map');
if (mapContainer) {
  const locations = JSON.parse(mapContainer.dataset.locations);

  const coordinates = locations.map((el) => {
    const [lat, lng] = el.coordinates;
    return [lng, lat];
  });

  const bounds = new L.LatLngBounds(coordinates);

  const map = L.map('map', { scrollWheelZoom: false });

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  map.fitBounds(bounds, {
    paddingTopLeft: [0, 100],
    paddingBottomRight: [0, 50],
  });

  const myIcon = L.icon({
    iconUrl: '/img/pin.png',
    iconSize: [25, 35],
    shadowSize: [68, 95],
    shadowAnchor: [22, 94],
    iconAnchor: [13, 35],
  });

  coordinates.forEach((coords, i) => {
    L.marker(coords, { icon: myIcon })
      .addTo(map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
        }),
      )
      .setPopupContent(`Day ${locations[i].day}: ${locations[i].description}`);
  });
}
