/*
Copyright 2015 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://raw.githubusercontent.com/fluid-project/chartAuthoring/master/LICENSE.txt
*/

(function ($, fluid) {

    "use strict";

    fluid.defaults("floe.chartAuthoring", {
        gradeNames: ["fluid.viewComponent"],
        selectors: {
            chartTitle: ".floec-chartTitle",
            chartDescription: ".floec-chartDescription",
            dataEntryPanel: ".floec-dataEntryPanel",
            pieChart: ".floec-pieChart"
        },
        components: {
            templateLoader: {
                type: "fluid.prefs.resourceLoader",
                options: {
                    events: {
                        onResourcesLoaded: "{chartAuthoring}.events.onTemplatesLoaded"
                    }
                }
            },
            chartAuthoringInterface: {
                type: "floe.chartAuthoring.templateInjection",
                createOnEvent: "onTemplatesLoaded",
                container: "{that}.dom.container",
                options: {
                    resources: {
                        template: "{templateLoader}.resources.chartAuthoringInterface"
                    },
                    listeners: {
                        "onTemplateInjected.escalate": "{chartAuthoring}.events.onChartAuthoringInterfaceReady.fire"
                    },
                    components: {
                        chartTitle: {
                            type: "fluid.inlineEdit",
                            container: "{chartAuthoring}.dom.chartTitle",
                            createOnEvent: "{chartAuthoring}.events.onChartAuthoringInterfaceReady",
                            options: {
                                strings: {
                                    defaultViewText: "{floe.chartAuthoring}.options.strings.defaultTitleText"
                                }
                            }
                        },
                        chartDescription: {
                            type: "fluid.inlineEdit",
                            container: "{chartAuthoring}.dom.chartDescription",
                            createOnEvent: "{chartAuthoring}.events.onChartAuthoringInterfaceReady",
                            options: {
                                strings: {
                                    defaultViewText: "{floe.chartAuthoring}.options.strings.defaultDescriptionText"
                                }
                            }

                        },
                        dataEntryPanel: {
                            type: "floe.chartAuthoring.dataEntryPanel",
                            createOnEvent: "{chartAuthoring}.events.onPieChartReady",
                            container: "{chartAuthoring}.dom.dataEntryPanel",
                            options: {
                                resources: {
                                    template: "{templateLoader}.resources.dataEntryPanel",
                                    dataEntry: "{templateLoader}.resources.dataEntry"
                                },
                                modelRelay: {
                                    source: "{that}.model.dataEntries",
                                    target: "{floe.chartAuthoring.pieChart}.model.dataSet",
                                    singleTransform: {
                                        type: "fluid.transforms.free",
                                        args: ["{that}.model.dataEntries"],
                                        func: "floe.chartAuthoring.dataEntriesToPieChartData"
                                    },
                                    backward: "never"
                                },
                                listeners: {
                                    "onCreate.escalate": {
                                        funcName: "{chartAuthoring}.events.onPanelReady.fire",
                                        priority: "last"
                                    }
                                }
                            }
                        },
                        pieChart: {
                            type: "floe.chartAuthoring.pieChart",
                            createOnEvent: "{chartAuthoring}.events.onChartAuthoringInterfaceReady",
                            container: "{chartAuthoring}.dom.pieChart",
                            options: {
                                resources: {
                                    template: "{templateLoader}.resources.pieChart"
                                },
                                listeners: {
                                    "onPieChartReady.escalate": "{chartAuthoring}.events.onPieChartReady.fire"
                                }
                            }
                        },
                        // Stub for sonification component when ready
                        sonifier: {
                            type: "fluid.modelComponent",
                            createOnEvent: "{chartAuthoring}.events.onChartAuthoringInterfaceReady",
                            options: {
                                modelRelay: {
                                    source: "{dataEntryPanel}.model.dataEntries",
                                    target: "{that}.model.dataSet",
                                    singleTransform: {
                                        type: "fluid.transforms.free",
                                        args: ["{dataEntryPanel}.model.dataEntries","{dataEntryPanel}.model.total.value"],
                                        func: "floe.chartAuthoring.dataEntriesToSonificationData"
                                    },
                                    backward: "never"
                                }
                            }
                        }
                    }
                }
            }
        },
        events: {
            onTemplatesLoaded: null,
            onChartAuthoringInterfaceReady: null,
            onPanelReady: null,
            onPieChartReady: null,
            onSonifierReady: null,
            onToolReady: {
                events: {
                    onPanelReady: "onPanelReady",
                    onPieChartReady: "onPieChartReady"
                },
                args: ["{that}"]
            }
        },
        listeners: {
            "onToolReady.addAriaConnections": "floe.chartAuthoring.addAriaConnections"
        },
        strings: {
            defaultTitleText: "Enter Chart Title",
            defaultDescriptionText: "Enter Chart Description"
        },
        // The terms and/or resources need to be set to the appropriate locations
        // by the integrator.
        templateLoader: {
            terms: {
                templatePrefix: ""
            },
            resources: {
                chartAuthoringInterface: "%templatePrefix/chartAuthoringInterfaceTemplate.html",
                dataEntryPanel: "%templatePrefix/dataEntryPanelTemplate.html",
                dataEntry: "%templatePrefix/dataEntryTemplate.html",
                pieChart: "%templatePrefix/pieChartTemplate.html"
            }
        },
        distributeOptions: [{
            source: "{that}.options.templateLoader",
            removeSource: true,
            target: "{that > templateLoader}.options"
        },
        {
            source: "{that}.options.pieChart",
            removeSource: true,
            target: "{that pieChart}.options"
        },
        {
            source: "{that}.options.dataEntryPanel",
            removeSource: true,
            target: "{that dataEntryPanel}.options"
        }]
    });

    // Given an object in the style of floe.chartAuthoring.dataEntryPanel.model.dataEntries,
    // convert it to an array of objects in the style used by the pieChart components,
    // maintaining object constancy by using the dataEntry object name as the key
    floe.chartAuthoring.dataEntriesToPieChartData = function(dataEntries) {

        var pieChartData = [];
        fluid.each(dataEntries, function(item, key) {
            if(item.value !== null) {
                var d = {
                    id: key,
                    label: item.label,
                    value: item.value
                };
                pieChartData.push(d);
            }
        });
        return pieChartData;
    };

    // TODO: better implementation, but works for immediate purposes

    floe.chartAuthoring.getSonificationUnits = function(value, unitDivisor) {
        var numberDivisors = Math.floor(value / unitDivisor);
        var numberRemainders = value % unitDivisor;
        var divisorArray =[];
        var remainderArray = [];
        for(var i=0; i<numberDivisors; i++) {
            divisorArray.push(unitDivisor);
        }
        for(i=0; i<numberRemainders; i++) {
            remainderArray.push(1);
        }

        return divisorArray.concat(remainderArray);
    };

    // Given an object in the style of floe.chartAuthoring.dataEntryPanel.model.dataEntries,
    // convert it to an array of objects in the style used by the sonification components,
    // maintaining object constancy by using the dataEntry object name as the key
    floe.chartAuthoring.dataEntriesToSonificationData = function(dataEntries, totalValue) {
        var sonificationData = [];
        fluid.each(dataEntries, function(item, key) {
            if(item.value !== null) {
                var percentage = Number(floe.chartAuthoring.percentage.calculate(item.value, totalValue).toFixed(0));
                var d = {
                    id: key,
                    label: item.label,
                    value: percentage,
                    units: floe.chartAuthoring.getSonificationUnits(percentage, 10)
                };
                sonificationData.push(d);
            }

        });
        sonificationData.sort(floe.chartAuthoring.pieChart.legend.sortAscending);
        return sonificationData;
    };

    // Adds aria attributes that only make sense within the context of the overall chart authoring tool
    // Specifically, adds:
    // - an aria-controls attribute for the dataEntryPanel's form referencing the unique IDs of the pie and legend
    floe.chartAuthoring.addAriaConnections = function(that) {

        var legendId = fluid.allocateSimpleId(that.chartAuthoringInterface.pieChart.legend.locate("table")),
            pieId = fluid.allocateSimpleId(that.chartAuthoringInterface.pieChart.pie.locate("pie")),
            totalId = fluid.allocateSimpleId(that.chartAuthoringInterface.dataEntryPanel.locate("totalValue"));


        that.chartAuthoringInterface.dataEntryPanel.locate("dataEntryForm").attr("aria-controls", legendId + " " + pieId + " " + totalId);
    };

})(jQuery, fluid);
