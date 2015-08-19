import Ember from 'ember';
import TableBlock from 'ember-table/mixins/table-block';

export default Ember.CollectionView.extend(TableBlock, {
  classNames: ['ember-table-header-block'],
  // TODO(new-api): Eliminate view alias
  itemView: 'header-row',
  itemViewClass: Ember.computed.alias('itemView'),
  
  content: Ember.computed(function() {
    return [this.get('columns')];
  }).property('columns'),

  onColumnsDidChange: Ember.observer('content', function() {
    var _this = this;
    Ember.run.schedule('afterRender', function() {
      if ((_this.get('_state') || _this.get('state')) !== 'inDOM') {
        return;
      }
      _this.$().scrollLeft(_this.get('scrollLeft'));
    });
  })
});
