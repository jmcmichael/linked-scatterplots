(function () {
  'use strict';
  angular.module('linkedVaf.figures')
    .controller('linkedVafController', linkedVafController);

  // @ngInject
  function linkedVafController($scope, $rootScope, $q, d3, dsv, _) {
    console.log('linkedVafController loaded.');
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
      vafXMin = 0,
      vafXMax = 65,
      vafYMin = 0,
      vafYMax = 65;

    vm.vaf1Options = {
      width: vafWidth,
      height: vafHeight,
      margin: vafMargin,
      title: 'Relapse 2 vs. Tumor Variant Allele Frequency',
      xAxis: 'Tumor Variant Allele Frequency',
      yAxis: 'Relapse 2 Variant Allele Frequency',
      xMin: vafXMin,
      xMax: vafXMax,
      yMin: vafYMin,
      yMax: vafYMax,
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
      xMin: vafXMin,
      xMax: vafXMax,
      yMin: vafYMin,
      yMax: vafYMax,
      id: 'vaf2',
      bubbleOpacity: bubbleOpacity,
      data: []
    };

    vm.vaf3Options = {
      width: vafWidth,
      height: vafHeight,
      margin: vafMargin,
      title: 'Relapse 2 vs. Relapse 1 VAF',
      xAxis: 'Relapse 2 Variant Allele Frequency',
      yAxis: 'Relapse 1 Variant Allele Frequency',
      xMin: vafXMin,
      xMax: vafXMax,
      yMin: vafYMin,
      yMax: vafYMax,
      id: 'vaf3',
      bubbleOpacity: bubbleOpacity,
      data: []
    };

    vm.parallelCoordsOptions = {
      width: 1140,
      height: 380,
      yMax: 100,
      xMax: 0,
      title: 'Variant Allele Frequency vs. Treatement Timepoint',
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
      data: []
    };

    var columnDefs = [
      {
        name: 'CHR',
        field: 'chr'
      },
      {
        name: 'POS',
        field: 'pos'
      },
      {
        name: 'Basechange',
        field: 'basechange'
      },
      {
        name: 'VAF 1',
        field: 'vaf1'
      },
      {
        name: 'VAF 2',
        field: 'vaf2'
      },
      {
        name: 'VAF 3',
        field: 'vaf3'
      }
    ];

    function onRegisterApi(gridApi) {
      var selectsRegistered = false;

      $scope.$watch('vm.data', function(data) {
        if (data.length > 0) {
          vm.gridOptions.data = data;
        }
      });

      gridApi.core.on.rowsRendered($scope, function() {
        // abort if no actual rows visible (means data hasn't been set yet)
        if (gridApi.grid.renderContainers.body.visibleRowCache.length === 0) { return; }

        // mark all rows as selected
        var rowEntities = _.pluck(gridApi.grid.rows, 'entity');
        _.forEach(rowEntities, function(rowEntity) {
          gridApi.selection.selectRow(rowEntity);
        });

        if (!selectsRegistered) {
          // setup selection callbacks
          gridApi.selection.on.rowSelectionChanged($scope, function(row) {
            toggleMuts([row]);
          });

          gridApi.selection.on.rowSelectionChangedBatch($scope, function(rows) {
            toggleMuts(rows);
          });
          selectsRegistered = true;
        } else {
          console.log('selects already registered.');
        }
      });
    }

    vm.gridOptions = {
      columnDefs: columnDefs,
      onRegisterApi: onRegisterApi,
      enableRowSelection: true,
      multiSelect: true,
      data: []
    };

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

        updateCharts();

        $scope.$on('vafBubbleOver', function(ngEvent, chartId, d3Event, mutation) {
          vm.mutHover = mutation;
          $scope.$apply();
        });
      });

    function updateCharts() {
      var clusters = _(vm.data)
        .map(function(c) { return Number(c.cluster) })
        .uniq()
        .sortBy()
        .value();

      var clusterScale = clusters.length <= 10 ? d3.scale.category10(): d3.scale.category20();

      vm.palette  = _.map(clusters, function(c) {return clusterScale(c); });

      var clusterMax = clusters.length;

      vm.vaf1Options.data = getVafData(vm.data, 1, vm.palette);
      vm.vaf1Options.palette = vm.palette;
      vm.vaf1Options.clusterMax = clusterMax;
      vm.vaf2Options.data = getVafData(vm.data, 2, vm.palette);
      vm.vaf2Options.palette = vm.palette;
      vm.vaf2Options.clusterMax = clusterMax;
      vm.vaf3Options.data = getVafData(vm.data, 3, vm.palette);
      vm.vaf3Options.palette = vm.palette;
      vm.vaf3Options.clusterMax = clusterMax;
      vm.parallelCoordsOptions.data = getParallelCoordsData(vm.data, vm.metadata, vm.palette);
      vm.parallelCoordsOptions.tooltipData = getTooltipData(vm.data);
      vm.parallelCoordsOptions.palette = vm.palette;
      vm.parallelCoordsOptions.clusterMax = clusterMax;
    }

    function getVafData(data, chart, palette) {
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
          x: 'vaf3',
          y: 'vaf2'
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
                // pos: Number(mut.pos),
                // basechange: mut.basechange,
                // annotation: parseAnnotation(mut.annotation)
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

    function toggleMuts(rows) {
      console.log('toggleMuts called on rows: ');
      console.log(rows);
      // for each row
      _.forEach(rows, function(row) {
        if(row.isSelected) {
          var d = _.find(vm.data, getMutFromRow(row));
          if(_.isUndefined(d)) {
            d = _.find(vm.originalData, getMutFromRow(row));
            vm.data.concat(d);
          } else {
            return;
         }
        } else {
          _.drop(vm.data, getMutFromRow(row));
        }
        updateCharts();
      });
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
  }

})();
