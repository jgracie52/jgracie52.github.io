---
layout: "../../layouts/PostLayout.astro"
title: "GeoJSON in Google Maps API"
description: "An exploration of possible optimizations for loading GeoJSON into Google Maps."
pubDate: "March 15 2024"
heroImage: "/GMapArticle.gif"
tags: [ "GIS", "google maps" ]
categories: [ "GIS & Mapping", "Web Development" ]
---

The other day, I was working on a side project involving some GIS data. I was specifically working with parcel lines (property lines) which are essentially a bunch of polygons with geo coordinates.

The parcel data was stored in GeoJSON files and I needed a way to display them in a map of some sort. Normally, you would use something like ArcGIS or OpenLayers, but I was feeling frisky and decided to do it in Google Maps instead.

The problem, however, was that Google Maps was not very well optimized for my gigantic GeoJSON files (200+MB of polygons per county). So, I decided to do a little exploration of possible optimizations for loading GeoJSON into Google Maps, and have documented them here for you, dear reader. Hopefully this helps you on your GIS journey.

## Intro - How to load GeoJSON into Google Maps

Before we talk optimizations, we should discuss how to load GeoJSON into the map to begin with. Google provides a few ways to load this data, but we will mainly be looking at `loadGeoJson()` and `addGeoJson()` (no, they are not the same).

`loadGeoJson()` takes a URL as input, this can be a local file such as `file:\\\C:\Users\{you}\Documents\parcels.geojson` or a web address such as `https://wwww.geostuff.com/parcels.geojson`.

`addGeoJson()`, on the other hand, works with the browser's File type. If you were to accept a file as input via an `<input>` tag, you would then be able to add that GeoJSON file via `addGeoJson()`.

Once loaded, you can then style the features using something like:

```javascript
map.data.setStyle({
      fillColor: 'black',
      strokeWeight: 1,
      strokeColor: '#ccc',
      strokeOpacity: 0.5,
      fillOpacity: 0.0
    });
```

To show the polygons as transparent with light gray and slightly opaque lines.

## Optimizations

Now that we have loaded the data, it's time to get to optimization. The first one that we will look at is coordinate precision.

### Coordinate Precision

This optimization is quite simple, we can reduce the size of our GeoJSON files (thereby increasing the speed Google Maps can load them) by reducing the precision (decimal places) of our feature coordinates.

Now I know what you are thinking, "why would I want to reduce the precision? Wouldn't having more precision be better so that we aren't showing the features wrong?". And the answer is 'probably not'. In some instances, you may want to keep a high precision, but usually, if you are dealing with maps, you only really need [6 decimal](https://gis.maricopa.gov/GIO/HistoricalAerial/help/why_do_you_need_6_decimal_places_.htm) places at most.

The reason for this is that maps can only render up to a certain height above the ground. Having a precision that is accurate to the millimeter is pointless when you can't really see the difference 50 feet up.

Google Maps doesn't provide a way for us to reduce the precision, but there are plenty of tools out there that can, such as GeoPandas for python.

### Zoom Rendering

Another optimization we can make is by only showing the features at certain zoom levels. That is to say, at zoom level x or less, do not show the polygons.

In Google Maps, the lower the zoom level, the farther out the camera is. So at lower zoom levels, we may not want to show polygons that are only really distinguishable (such as parcel lines) at higher zoom levels.

A way that we can achieve this is by first setting the feature properties to include `visible:false`, such as below:

```javascript
map.data.setStyle({
      visible: false
      fillColor: 'black',
      strokeWeight: 1,
      strokeColor: '#ccc',
      strokeOpacity: 0.5,
      fillOpacity: 0.0
    });
```
Once all of the features invisible, we can then create an event listener for the 'zoom_changed' event.

```javascript
map.addListener('zoom_changed', () => {
    // Style the geojson data based on the zoom level
    // if the zoom level is greater or equal to 14, show the geojson data
    const zoom = mapRef.value?.map?.getZoom();
    mapRef.value?.map?.data.forEach((feature: any) => {
      if(zoom < minZoom){
        if(feature.getProperty('visible') != false){
          feature.setProperty('visible', false);
          mapRef.value?.map?.data.overrideStyle(feature, {
            visible: false
          });
        }
        return;
      }
      else if(feature.getProperty('visible') == false){
          feature.setProperty('visible', true);
          mapRef.value?.map?.data.overrideStyle(feature, {
            visible: true
          });
      }
    });
  });
```

The above code iterates through each feature in the dataset, and checks if the zoom is at the correct level. If it is, it sets the visibility of the feature to true, and false otherwise.

Now, we could just do a check on the zoom, and set the visibility for all the features at once. And if we were only going to do the zoom optimization, that is what we would do. However, with this next trick, we would definitely want to iterate through all the features.

### Boundary Rendering

For out last optimization, we are going to look at using Google Map's boundary function to check if a feature is within the map boundary (screen view) or not.

To do this, we must first create an event listener for the `boundary_changed` event:

```javascript
// Add a listener to the map to check for bounds changes
  mapRef.value?.map?.addListener('bounds_changed', () => {
    // Get the bounds of the map
    const bounds = mapRef.value?.map?.getBounds();
    const zoom = mapRef.value?.map?.getZoom();
    // Now, we want to style the geojson data based on the bounds of the map
    // if a geojson feature is within the bounds, we want to show it, otherwise, we want to hide it
    mapRef.value?.map?.data.forEach(async (feature: any) => {
        checkShowFeature(feature, bounds, zoom);
    });
  });
})
```

Once we have created the listener, we can then go through each of the features (asynchronously, in this case, to save a bit of processing time) and check if at least one vertex is in the boundary or not.

```javascript
async function checkShowFeature(feature:any, bounds, zoom){
// Check if the feature is within the bounds and is not already visible
      // We also want to make sure that we are at the correct zoom level

      // First check the zoom level (no need to check bounds if the zoom level is too low)
      if(zoom < minZoom){
        if(feature.getProperty('visible') != false){
          feature.setProperty('visible', false);
          mapRef.value?.map?.data.overrideStyle(feature, {
            visible: false
          });
        }
        return;
      }

      // Check each lat/lng point in the feature geometry to see if it is within the bounds
      let inBounds = false;
      feature.getGeometry().forEachLatLng((latlng: any) => {
          if(bounds?.contains(latlng)){
            inBounds = true;

            // If we found a point within the bounds, we can break out of the loop
            return;
          }
      });
      
      if(inBounds){
        if(feature.getProperty('visible') == false){
          feature.setProperty('visible', true);
          mapRef.value?.map?.data.overrideStyle(feature, {
            visible: true
          });
        }
      }
      else{
        if(feature.getProperty('visible') != false){
          feature.setProperty('visible', false);
          mapRef.value?.map?.data.overrideStyle(feature, {
            visible: false
          });
        }
      }
}
```

The above code combines what we did in the Zoom Rendering section to only show the feature if we are at the minimum zoom level. From there, we calculate if at least one vertex of the feature is in the boundary, and if it is, we then set the visibility.

Making this function async helps to speed things up a bit when calculating if a vertex is in a boundary. I'm sure there are some other ways we can improve this, but just being able to show a feature based on if it is in the bounds or not is a huge performance improvement for large GeoJSON files.

## Conclusion

So, today we looked at how to load GeoJSON into Google Maps API, and how to optimize it for large files so that Google Maps doesn't crap 💩 its pants from loading massive amounts of polygons.

I'm sure there are plenty of other improvements we could make, but this will definitely do for now. Oh, and if you are looking to do actual data sciencey stuff with GIS, I'd suggest using a tool that is purpose built for that, as opposed to Google Maps. But hey, 'to each their own' as they say ¯\_(ツ)_/¯.

Thanks for reading, and good luck on your GIS journey.