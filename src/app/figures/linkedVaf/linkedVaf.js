(function () {
  'use strict';
  angular.module('linkedVaf.figures')
    .controller('LinkedVafController', LinkedVafController)
    .config(linkedVafConfig);

  // @ngInject
  function linkedVafConfig() {

  }

  // @ngInject
  function LinkedVafController($scope, $rootScope, $q,
                               uiGridConstants, uiGridExporterConstants,
                               d3, dsv, _, growl) {
    console.log('LinkedVafController loaded.');
    var vm = $scope.vm = {};

    vm.data = [];
    vm.originalData = [];

    vm.chart1 = {};
    vm.chart2 = {};
    vm.chart3 = {};

    vm.vaf1Options = {};
    vm.vaf2Options = {};
    vm.vaf3Options = {};
    vm.parallelCoordsOptions = {
      data: []
    };

    vm.mutHover = {};
    vm.palette = [];

    vm.clusterIncluded = function(cluster) {
      return _.filter(vm.data, { cluster: String(cluster) }).length > 0;
    };

    vm.allClusterIncluded = function(cluster) {
      var oCount = _.filter(vm.originalData, { cluster: String(cluster) });
      var dCount = _.filter(vm.data, { cluster: String(cluster) });
      return dCount.length === oCount.length;
    };

    var vafWidth = 380,
      vafHeight = 380,
      vafMargin = {
        top: 40,
        right: 25,
        bottom: 40,
        left: 50
      },
      bubbleOpacity = 0.5,
      pathOpacity = 0.3,
      pathHoverWidth = 4;

    vm.vaf1Options = {
      width: vafWidth,
      height: vafHeight,
      margin: vafMargin,
      title: 'Tumor vs. Relapse 2 VAF',
      xAxis: 'Tumor Variant Allele Frequency',
      yAxis: 'Relapse 2 Variant Allele Frequency',
      id: 'vaf1',
      bubbleOpacity: bubbleOpacity,
      data: []
    };

    vm.vaf2Options = {
      width: vafWidth,
      height: vafHeight,
      margin: vafMargin,
      title: 'Tumor vs. Relapse 1 VAF',
      xAxis: 'Tumor Variant Allele Frequency',
      yAxis: 'Relapse 1 Variant Allele Frequency',
      id: 'vaf2',
      bubbleOpacity: bubbleOpacity,
      data: []
    };

    vm.vaf3Options = {
      width: vafWidth,
      height: vafHeight,
      margin: vafMargin,
      title: 'Relapse 1 vs. Relapse 2 VAF',
      xAxis: 'Relapse 1 Variant Allele Frequency',
      yAxis: 'Relapse 2 Variant Allele Frequency',
      id: 'vaf3',
      bubbleOpacity: bubbleOpacity,
      data: []
    };

    vm.parallelCoordsOptions = {
      width: 1140,
      height: 380,
      yMax: 100,
      xMax: 0,
      title: 'Variant Allele Frequency vs. Treatment Timepoint',
      xAxis: 'Treatment Timepoint',
      yAxis: 'Variant Allele Frequency',
      margin: {
        top: 40,
        right: 25,
        bottom: 40,
        left: 55
      },
      id: 'vafParallel',
      pathOpacity: pathOpacity,
      pathHoverWidth: pathHoverWidth,
      data: []
    };

    var uiGridCustom = {
      filter: {
        GREATER_THAN: function (searchTerm, cellValue) {
          if (searchTerm == '')
            return true;
          else return Number(cellValue) > Number(searchTerm);
        },
        LESS_THAN: function (searchTerm, cellValue) {
          if (searchTerm == '')
            return true;
          else return Number(cellValue) < Number(searchTerm);
        }
      }
    };

    var columnDefs = [
      {
        name: 'Cluster',
        field: 'cluster',
        sort: { direction: 'asc', priority: 0 },
        filter: {
          condition: uiGridConstants.filter.EXACT
        },
        enableFiltering: true
      },
      {
        name: 'CHR',
        field: 'chr',
        filter: {
          condition: uiGridConstants.filter.EXACT
        },
        enableFiltering: true,
        type: 'number'
      },
      {
        name: 'POS',
        field: 'pos',
        type: 'number'
      },
      {
        name: 'Basechange',
        field: 'basechange',
        enableFiltering: true,
        enableSorting: false,
        filter: {
          type: uiGridConstants.filter.SELECT,
          term: null,
          disableCancelFilterButton: false,
          selectOptions: [
            { value: null, label: '--' },
            { value: 'A-C', label: 'A-C'},
            { value: 'A-G', label: 'A-G'},
            { value: 'C-A', label: 'C-A'},
            { value: 'C-G', label: 'C-G'},
            { value: 'C-T', label: 'C-T'},
            { value: 'G-A', label: 'G-A'},
            { value: 'G-C', label: 'G-C'},
            { value: 'G-T', label: 'G-T'},
            { value: 'T-A', label: 'T-A'},
            { value: 'T-C', label: 'T-C'}
          ]
          //['A-C', 'A-G', 'C-A', 'C-G', 'C-T', 'G-A', 'G-C', 'G-T', 'T-A', 'T-C']
        }
      },
      {
        name: 'VAF 1',
        field: 'vaf1',
        enableFiltering: true,
        type: 'number',
        filters: [
          {
            condition: uiGridCustom.filter.GREATER_THAN,
            placeholder: ' >'
          },
          {
            condition: uiGridCustom.filter.LESS_THAN,
            placeholder: ' <'
          }
        ]
      },
      {
        name: 'VAF 2',
        field: 'vaf2',
        enableFiltering: true,
        type: 'number',
        filters: [
          {
            condition: uiGridCustom.filter.GREATER_THAN,
            placeholder: ' >'
          },
          {
            condition: uiGridCustom.filter.LESS_THAN,
            placeholder: ' <'
          }
        ]
      },
      {
        name: 'VAF 3',
        field: 'vaf3',
        enableFiltering: true,
        type: 'number',
        filters: [
          {
            condition: uiGridCustom.filter.GREATER_THAN,
            placeholder: ' >'
          },
          {
            condition: uiGridCustom.filter.LESS_THAN,
            placeholder: ' <'
          }
        ]
      },
      {
        name: 'Effect',
        field: 'Effect',
        enableFiltering: true
      },
      {
        name: 'Gene',
        field: 'Gene',
        enableFiltering: true
      }
    ];

    vm.gridOptions = {
      columnDefs: columnDefs,
      minRowsToShow: 15,
      onRegisterApi: onRegisterApi,
      enableRowSelection: true,
      enableColumnMenus: false,
      enableFiltering: true,
      enableSelectAll: false,
      showGridFooter: false,
      multiSelect: true,
      data: [],

      // data export
      exporterOlderExcelCompatibility: false,
      exporterPdfDefaultStyle: { fontSize: 7 },
      exporterPdfPageSize: 'LETTER',
      exporterPdfOrientation: 'landscape',

      exporterPdfTableStyle: {
        margin: [0, 0, 0, 0]
      },
      exporterPdfTableHeaderStyle: {fontSize: 10, bold: true, italics: true, color: 'darkgrey'},
      exporterPdfMaxGridWidth: 630,
      exporterPdfTableLayout: 'lightHorizontalLines', // does not appear to have any effect :(ch

    };

    vm.exportPopover = {
      templateUrl: 'figures/linkedVaf/exportDataPopover.tpl.html',
      title: 'Save a PDF or CSV',
      include: 'all',
      type: 'csv'
    };

    vm.includeAll = function() {
      setMuts(vm.gridApi.grid.rows, true);
      _.forEach(vm.gridApi.grid.rows, function(row) {
        vm.gridApi.core.clearRowInvisible(row);
      });
      $rootScope.$broadcast('clearSelection');
    };

    vm.includeFiltered = function() {
      var rows = vm.gridApi.core.getVisibleRows();
      if(rows.length === 0) {
        growl.info("No filtered rows, no action taken.");
        return;
      }
      setMuts(rows, true);
      $rootScope.$broadcast('clearSelection');
    };

    vm.includeFilteredOnly = function() {
      var iRows = _.filter(vm.gridApi.grid.rows, { visible: false });
      var vRows = _.filter(vm.gridApi.grid.rows, { visible: true });
      setMuts(iRows, false);
      setMuts(vRows, true);
      $rootScope.$broadcast('clearSelection');
    };

    vm.excludeFiltered = function() {
      var rows = vm.gridApi.core.getVisibleRows();
      setMuts(rows, false);
      $rootScope.$broadcast('clearSelection');
    };

    vm.excludeFilteredOnly = function() {
      var iRows = _.filter(vm.gridApi.grid.rows, { visible: false });
      var vRows = _.filter(vm.gridApi.grid.rows, { visible: true });
      setMuts(iRows, true);
      setMuts(vRows, false);
      $rootScope.$broadcast('clearSelection');
    };

    vm.toggleCluster = function(cluster) {
      cluster = String(cluster);
      var clusterRows = _.filter(vm.gridApi.grid.rows, function(row) {
        return row.entity.cluster === cluster;
      });
      if(vm.allClusterIncluded(cluster)) {
        setMuts(clusterRows, false);
      } else {
        // set mutations and update charts
        setMuts(clusterRows, true);
      }
    };

    function onRegisterApi(gridApi) {
      vm.gridApi = gridApi;

      var selectsRegistered = false;
      var dataInit = false;
      $scope.$watch('vm.data', function(data) {
        if (data.length > 0 && dataInit === false) {
          angular.copy(getGridData(data),vm.gridOptions.data);
          dataInit = true;
        }
      });

      vm.exportData = function(select) {
        vm.gridOptions.exporterCsvFilename = 'AML31_VAF.csv';
        var rows = select === 'all' ? uiGridExporterConstants.ALL : uiGridExporterConstants.VISIBLE;
        gridApi.exporter.csvExport(rows, uiGridExporterConstants.ALL);
      };

      gridApi.core.on.rowsRendered($scope, function() {
        // abort if no actual rows visible (means data hasn't been set yet)
        if (gridApi.grid.renderContainers.body.visibleRowCache.length === 0) { return; }

        if (!selectsRegistered) {
          // mark all rows as selected
          var rowEntities = _.map(gridApi.grid.rows, 'entity');
          _.forEach(rowEntities, function(rowEntity) {
            gridApi.selection.selectRow(rowEntity);
          });

          // setup selection callbacks
          gridApi.selection.on.rowSelectionChanged($scope, function(row) {
            toggleMuts([row]);
          });

          gridApi.selection.on.rowSelectionChangedBatch($scope,function(rows){
            toggleMuts(rows);
          });

          selectsRegistered = true;
        } else {
          console.log('selects already registered.');
        }
      });

      // filter any selected variants
      $scope.$on('clearSelection', function(ngEvent, chartId) {
        if(!_.isUndefined(chartId)) { // event comes from a chart, so we clear filters
          gridApi.grid.clearAllFilters();
        }
        _.forEach(gridApi.grid.rows, function(row) {
          gridApi.core.clearRowInvisible(row);
        });
      });

      // filter any selected variants
      $scope.$on('vafSelectEnd', function(ngEvent, selected) {
        console.log(selected);
        var rows = _(gridApi.grid.rows)
          .partition(function(row) {
            return _.some(selected, {
              chr: Number(row.entity.chr),
              pos: Number(row.entity.pos),
              basechange: row.entity.basechange
            })
          })
          .value();

        _.forEach(rows[0], function(row) {
          gridApi.core.clearRowInvisible(row);
        });

        _.forEach(rows[1], function(row) {
          gridApi.core.setRowInvisible(row);
        });
      });

    }

    $q.all([
      dsv.tsv({ method:'GET', url: 'data/input.aml31_v1a.tsv.txt' }),
      dsv.tsv({ method:'GET', url: 'data/metadata.tsv.txt' })
    ])
      .then(function(dataTSV) {
        vm.data = _.map(dataTSV[0].data, function(d) {
          d.basechange = d.basechange .replace('/', '-');
          return d;
        });

        angular.copy(vm.data, vm.originalData);

        var metaData = vm.metadata = dataTSV[1].data;

        vm.clusters = _(vm.data)
          .map(function(c) { return Number(c.cluster) })
          .uniq()
          .sortBy()
          .value();

        updateCharts();

        $scope.$on('vafBubbleOver', function(ngEvent, chartId, d3Event, mutation) {
          vm.mutHover = mutation;
          $scope.$apply();
        });
      });

    function updateCharts() {
      var includedClusters = _(vm.data)
        .map(function(c) { return Number(c.cluster) })
        .uniq()
        .sortBy()
        .value();

      if (includedClusters.length > 20) {
        console.warn('More than 20 clusters - palette colors will repeat.');
      }

      vm.palette = _.partial(function(clusters, clusterNo) {
        if(clusters.length <= 10) {
          var scale = d3.scale.category10();
        } else {
          var scale = d3.scale.category20();
        }
        return scale.range()[clusterNo-1];
      }, includedClusters);

      var maxVaf = _.max([
        _.max(_.map(vm.data, function(d) { return Number(d.vaf1)})),
        _.max(_.map(vm.data, function(d) { return Number(d.vaf2)})),
        _.max(_.map(vm.data, function(d) { return Number(d.vaf3)}))
      ]);

      vm.vaf1Options.data = getVafData(vm.data, 1);
      vm.vaf1Options.xMax = vm.vaf1Options.yMax = maxVaf;
      vm.vaf2Options.data = getVafData(vm.data, 2);
      vm.vaf2Options.xMax = vm.vaf2Options.yMax = maxVaf;
      vm.vaf3Options.data = getVafData(vm.data, 3);
      vm.vaf3Options.xMax = vm.vaf3Options.yMax = maxVaf;
      vm.parallelCoordsOptions.data = getParallelCoordsData(vm.data, vm.metadata, vm.palette);
      vm.parallelCoordsOptions.tooltipData = getTooltipData(vm.data);
    }

    function getGridData(data) {
      return _(data)
        .map(function(row) {
          _.forEach(parseAnnotation(row.annotation), function(val, key) {
            row[_.capitalize(key)] = val;
          });
          return _.omit(row, 'annotation');
        })
        .value();
    };

    function getVafData(data, chart) {
      var specs = {
        1: {
          x: 'vaf1',
          y: 'vaf3'
        },
        2: {
          x: 'vaf1',
          y: 'vaf2'
        },
        3: {
          x: 'vaf2',
          y: 'vaf3'
        }
      };

      return _.map(data, function(mut) {
        return {
          x: Number(mut[specs[chart].x]),
          y: Number(mut[specs[chart].y]),
          chr: Number(mut.chr),
          pos: Number(mut.pos),
          basechange: mut.basechange,
          cluster: Number(mut.cluster),
          colorKey: 'cluster' + mut.cluster,
          annotation: parseAnnotation(mut.annotation)
        }
      });
    }

    function getParallelCoordsData(data, metadata) {
      var vafs = _.map(metadata, 'column_label');

      return _(data)
        .map(function(mut) {
          return _(vafs)
            .map(function(vaf) {
              var meta = _.find(metadata, {column_label: vaf});
              return {
                series: [mut.chr, mut.pos, mut.basechange].join('|'),
                timepoint: Number(meta.timepoint),
                timepointLabel: meta.plot_label,
                vaf: Number(mut[vaf]),
                cluster: Number(mut.cluster),
                chr: Number(mut.chr),
                colorKey: 'cluster' + mut.cluster
              };
            })
            .value();
        })
        .flatten()
        .sortBy(['series', 'timepoint'])
        .value();
    }

    function getTooltipData(vafData) {
      return _(vafData)
        .map(function(mut) {
          return {
            key: getMutationKey(mut),
            vaf1: Number(mut.vaf1),
            vaf2: Number(mut.vaf2),
            vaf3: Number(mut.vaf3),
            chr: Number(mut.chr),
            pos: Number(mut.pos),
            basechange: mut.basechange,
            cluster: Number(mut.cluster),
            annotation: parseAnnotation(mut.annotation)
          }
        })
        .value();
    }

    function getMutationKey(mut) {
      return [mut.chr, mut.pos, mut.basechange].join('|');
    }

    function parseAnnotation(ann) {
      return _(ann.split(';'))
        .map(function(ann) { return ann.split(':');})
        .zipObject()
        .value()
    }

    function setMuts(rows, selected) {
      var rowEntities = _(rows).map('entity').value();
      // check to see if all muts would be hidden
      var allRows = selected === false &&
        rowEntities.length === vm.data.length &&
        _.isEqualWith(vm.data, rowEntities, function(r1, r2) {
          return r1.chr === r2.chr && r1.pos === r2.pos && r1.basechange === r2.basechange;
        });

      if(allRows) {
        growl.warning('Action would leave no rows remaining. Aborting.');
      } else {
        _.forEach(rows, function (row) {
          if (row.isSelected && selected === false) {
            _.remove(vm.data, getMutFromRow(row));
            row.setSelected(false);
          } else if (!row.isSelected && selected === true) {
            var d = _.find(vm.data, getMutFromRow(row));
            if (_.isUndefined(d)) {
              d = _.find(vm.originalData, getMutFromRow(row));
              vm.data.push(d);
              row.setSelected(true)
            } else {
              row.setSelected(true)
            }
          }
        });
        updateCharts();
      }
    }

    function toggleMuts(rows) {
      // for each row
      _.forEach(rows, function(row) {
        if(row.isSelected) {
          var d = _.find(vm.data, getMutFromRow(row));
          if(_.isUndefined(d)) {
            d = _.find(vm.originalData, getMutFromRow(row));
            vm.data.push(d);
          } else {
            return;
          }
        } else {
          _.remove(vm.data, getMutFromRow(row));
        }
      });
      updateCharts();
      // if isSelected
      // find in vm.data, if it's there do nothing
      // if it's not there, find it in originalData and add it back to data

      // if isSelected === false
      // find in data, if not there, do nothing
      // if there, remove
    }

    function getMutFromRow(row) {
      return {
        chr: row.entity.chr,
        pos: row.entity.pos,
        basechange: row.entity.basechange
      }
    }

    vm.startTour = function() {
      TourService.start();
    }
  }

})();
